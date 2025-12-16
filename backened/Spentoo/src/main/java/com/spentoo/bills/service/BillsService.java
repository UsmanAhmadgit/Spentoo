package com.spentoo.bills.service;

import com.spentoo.bills.dto.BillDTO;
import com.spentoo.bills.dto.BillParticipantDTO;
import com.spentoo.bills.dto.CreateBillRequestDTO;
import com.spentoo.bills.dto.UpdateBillRequestDTO;
import com.spentoo.bills.model.Bills;
import com.spentoo.bills.model.BillsParticipant;
import com.spentoo.bills.repository.BillsParticipantRepository;
import com.spentoo.bills.repository.BillsRepository;
import com.spentoo.category.model.Category;
import com.spentoo.category.model.CategoryType;
import com.spentoo.category.repository.CategoryRepository;
import com.spentoo.category.service.CategoryService; // Import CategoryService
import com.spentoo.expense.dto.CreateExpenseRequestDTO;
import com.spentoo.expense.dto.UpdateExpenseRequestDTO;
import com.spentoo.expense.model.Expense;
import com.spentoo.expense.repository.ExpenseRepository;
import com.spentoo.expense.service.ExpenseService;
import com.spentoo.payment.model.PaymentMethod;
import com.spentoo.payment.repository.PaymentMethodRepository;
import com.spentoo.payment.service.PaymentMethodService; // Import PaymentMethodService
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BillsService {

    private final BillsRepository billsRepository;
    private final BillsParticipantRepository billsParticipantRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final ExpenseService expenseService; // To create expense for the creator
    private final ExpenseRepository expenseRepository; // To find and delete/update expense
    private final CategoryService categoryService; // Inject CategoryService
    private final PaymentMethodService paymentMethodService; // Inject PaymentMethodService

    public BillsService(BillsRepository billsRepository, BillsParticipantRepository billsParticipantRepository,
                        UserRepository userRepository, CategoryRepository categoryRepository,
                        PaymentMethodRepository paymentMethodRepository, ExpenseService expenseService,
                        ExpenseRepository expenseRepository, CategoryService categoryService,
                        PaymentMethodService paymentMethodService) {
        this.billsRepository = billsRepository;
        this.billsParticipantRepository = billsParticipantRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.expenseService = expenseService;
        this.expenseRepository = expenseRepository;
        this.categoryService = categoryService;
        this.paymentMethodService = paymentMethodService;
    }

    @Transactional
    public BillDTO createBill(CreateBillRequestDTO requestDTO, String userEmail) {
        // 1. Find the user
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        // 2. Validate total amount
        if (requestDTO.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Total amount must be greater than 0.");
        }

        // 3. Validate participants (optional - only validate if provided)
        BigDecimal sumOfShares = BigDecimal.ZERO;
        BillParticipantDTO creatorParticipantDTO = null;
        int creatorCount = 0;

        if (requestDTO.getParticipants() != null && !requestDTO.getParticipants().isEmpty()) {
            for (BillParticipantDTO participantDTO : requestDTO.getParticipants()) {
                if (participantDTO.getShareAmount() == null || participantDTO.getShareAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalStateException("Participant share amount must be greater than 0.");
                }
                if (participantDTO.getParticipantName() == null || participantDTO.getParticipantName().trim().isEmpty()) {
                    throw new IllegalStateException("Participant name cannot be empty.");
                }
                sumOfShares = sumOfShares.add(participantDTO.getShareAmount());
                
                // Count creators based on isCreator flag from frontend
                // Debug: Log participant details
                boolean isCreator = participantDTO.isCreator();
                System.out.println("Participant: " + participantDTO.getParticipantName() + ", isCreator: " + isCreator);
                if (isCreator) {
                    creatorParticipantDTO = participantDTO;
                    creatorCount++;
                }
            }

            // Validate exactly one creator (only if participants are provided)
            System.out.println("Total creator count: " + creatorCount);
            if (creatorCount != 1) {
                throw new IllegalStateException("Exactly one participant must be marked as the creator. Found: " + creatorCount);
            }

            if (sumOfShares.compareTo(requestDTO.getTotalAmount()) != 0) {
                throw new IllegalStateException("Sum of participant shares must equal the total bill amount.");
            }
        }
        // If no participants, creator validation is skipped (participants are optional)

        // 4. Validate Category for creator's expense (only if participants exist)
        Category category = null;
        PaymentMethod paymentMethod = null;
        
        if (creatorParticipantDTO != null) {
            // Category is required when there's a creator participant
            if (requestDTO.getCategoryId() == null) {
                throw new IllegalStateException("Category ID is required when participants are provided.");
            }
            category = categoryRepository.findById(requestDTO.getCategoryId())
                    .filter(cat -> cat.getUser().getUserId().equals(user.getUserId()))
                    .orElseThrow(() -> new IllegalStateException("Category not found or access denied."));
            
            if (!category.isActive()) {
                throw new IllegalStateException("Cannot use inactive categories.");
            }
            
            if (category.getType() != CategoryType.EXPENSE) {
                throw new IllegalStateException("Bill category must be of type EXPENSE.");
            }

            // 5. Handle Payment Method for creator's expense
            if (requestDTO.getPaymentMethodId() == null) {
                paymentMethod = paymentMethodRepository.findByUserAndName(user, "Cash")
                        .orElseThrow(() -> new IllegalStateException("Default 'Cash' payment method not found for user."));
            } else {
                paymentMethod = paymentMethodRepository.findById(requestDTO.getPaymentMethodId())
                        .filter(pm -> pm.getUser().getUserId().equals(user.getUserId()))
                        .orElseThrow(() -> new IllegalStateException("Payment method not found or access denied."));
            }
        }

        // 6. Create and save the Bill
        Bills newBill = new Bills();
        newBill.setUser(user);
        newBill.setTotalAmount(requestDTO.getTotalAmount());
        // Handle null/empty description (database allows null)
        String description = requestDTO.getDescription();
        if (description != null && !description.trim().isEmpty()) {
            newBill.setDescription(description.trim());
        } else {
            newBill.setDescription(null);
        }
        newBill.setStatus("Unpaid"); // Default status
        Bills savedBill = billsRepository.save(newBill);

        // 7. Create and save Participants (only if provided)
        if (requestDTO.getParticipants() != null && !requestDTO.getParticipants().isEmpty()) {
            for (BillParticipantDTO participantDTO : requestDTO.getParticipants()) {
                if (participantDTO == null) {
                    continue; // Skip null participants
                }
                BillsParticipant participant = new BillsParticipant();
                participant.setBill(savedBill);
                participant.setParticipantName(participantDTO.getParticipantName());
                participant.setShareAmount(participantDTO.getShareAmount());
                // Use isCreator flag from frontend
                participant.setCreator(participantDTO.isCreator());
                billsParticipantRepository.save(participant);
            }
        }

        // 8. Create Expense record for the creator's share (only if creator exists)
        if (creatorParticipantDTO != null && category != null && paymentMethod != null) {
            CreateExpenseRequestDTO createExpenseRequest = new CreateExpenseRequestDTO();
            createExpenseRequest.setCategoryId(requestDTO.getCategoryId());
            createExpenseRequest.setPaymentMethodId(paymentMethod.getMethodId());
            createExpenseRequest.setAmount(creatorParticipantDTO.getShareAmount());
            createExpenseRequest.setDescription("Bill: " + (requestDTO.getDescription() != null ? requestDTO.getDescription() : ""));
            expenseService.addExpense(createExpenseRequest, userEmail);
        }

        // 9. Convert to DTO and return
        return convertToDTO(savedBill);
    }

    @Transactional
    public BillDTO updateBill(Integer billsId, UpdateBillRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        Bills existingBill = billsRepository.findByIdAndUser(billsId, user)
                .orElseThrow(() -> new IllegalStateException("Bill not found or access denied."));

        // 1. Validate total amount
        if (requestDTO.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Total amount must be greater than 0.");
        }

        // 2. Validate participants (optional - only validate if provided)
        BigDecimal sumOfShares = BigDecimal.ZERO;
        BillParticipantDTO creatorParticipantDTO = null;
        int creatorCount = 0;

        if (requestDTO.getParticipants() != null && !requestDTO.getParticipants().isEmpty()) {
            for (BillParticipantDTO participantDTO : requestDTO.getParticipants()) {
                if (participantDTO.getShareAmount() == null || participantDTO.getShareAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalStateException("Participant share amount must be greater than 0.");
                }
                if (participantDTO.getParticipantName() == null || participantDTO.getParticipantName().trim().isEmpty()) {
                    throw new IllegalStateException("Participant name cannot be empty.");
                }
                sumOfShares = sumOfShares.add(participantDTO.getShareAmount());
                
                // Count creators based on isCreator flag from frontend
                // Debug: Log participant details
                boolean isCreator = participantDTO.isCreator();
                System.out.println("[UPDATE] Participant: " + participantDTO.getParticipantName() + ", isCreator: " + isCreator);
                if (isCreator) {
                    creatorParticipantDTO = participantDTO;
                    creatorCount++;
                }
            }

            // Validate exactly one creator
            System.out.println("[UPDATE] Total creator count: " + creatorCount);
            if (creatorCount != 1) {
                throw new IllegalStateException("Exactly one participant must be marked as the creator. Found: " + creatorCount);
            }

            if (sumOfShares.compareTo(requestDTO.getTotalAmount()) != 0) {
                throw new IllegalStateException("Sum of participant shares must equal the total bill amount.");
            }
        }

        // 3. Update Bill details
        existingBill.setTotalAmount(requestDTO.getTotalAmount());
        existingBill.setDescription(requestDTO.getDescription());
        if (requestDTO.getStatus() != null && (requestDTO.getStatus().equalsIgnoreCase("Paid") || requestDTO.getStatus().equalsIgnoreCase("Unpaid"))) {
            existingBill.setStatus(requestDTO.getStatus());
        } else if (requestDTO.getStatus() != null) {
            throw new IllegalStateException("Invalid status. Must be 'Paid' or 'Unpaid'.");
        }

        // 4. Update Participants (only if provided)
        if (requestDTO.getParticipants() != null) {
            // Get current participants
            Set<BillsParticipant> currentParticipants = existingBill.getParticipants();
            
            if (requestDTO.getParticipants().isEmpty()) {
                // If empty list provided, remove all participants
                currentParticipants.clear();
            } else {
                // Participants to keep/update
                Set<BillsParticipant> participantsToKeep = requestDTO.getParticipants().stream()
                        .filter(pDto -> pDto.getParticipantId() != null)
                        .map(pDto -> billsParticipantRepository.findById(pDto.getParticipantId())
                                .orElseThrow(() -> new IllegalStateException("Participant not found: " + pDto.getParticipantId())))
                        .collect(Collectors.toSet());

                // Remove participants not in the new list
                currentParticipants.removeIf(p -> !participantsToKeep.contains(p));

                // Update or add participants
                for (BillParticipantDTO pDto : requestDTO.getParticipants()) {
                    // Use isCreator flag from frontend
                    boolean isCreator = pDto.isCreator();
                    
                    if (pDto.getParticipantId() != null) {
                        // Update existing
                        BillsParticipant participant = participantsToKeep.stream()
                                .filter(p -> p.getParticipantId().equals(pDto.getParticipantId()))
                                .findFirst()
                                .orElseThrow(() -> new IllegalStateException("Participant not found: " + pDto.getParticipantId()));
                        participant.setParticipantName(pDto.getParticipantName());
                        participant.setShareAmount(pDto.getShareAmount());
                        // Use isCreator flag from frontend
                        participant.setCreator(isCreator);
                    } else {
                        // Add new
                        BillsParticipant newParticipant = new BillsParticipant();
                        newParticipant.setBill(existingBill);
                        newParticipant.setParticipantName(pDto.getParticipantName());
                        newParticipant.setShareAmount(pDto.getShareAmount());
                        // Use isCreator flag from frontend
                        newParticipant.setCreator(isCreator);
                        currentParticipants.add(newParticipant);
                    }
                }
            }
            existingBill.setParticipants(currentParticipants); // Update the collection
        }

        Bills updatedBill = billsRepository.save(existingBill);

        // 5. Update Expense record for the creator's share (only if creator exists)
        if (creatorParticipantDTO != null) {
            // Find the existing expense associated with this bill (assuming one-to-one or identifiable link)
            // This is a simplification. In a real app, you might store ExpenseID in Bills table.
            // For now, we'll try to find an expense matching the bill's creator, category, and amount.
            // A more robust solution would be to link Bill to Expense directly.
            Optional<Expense> existingExpenseOptional = expenseRepository.findByUserAndDescriptionContaining(user, "Bill: " + existingBill.getDescription());

            if (existingExpenseOptional.isPresent()) {
                Expense existingExpense = existingExpenseOptional.get();
                UpdateExpenseRequestDTO updateExpenseRequest = new UpdateExpenseRequestDTO();
                updateExpenseRequest.setAmount(creatorParticipantDTO.getShareAmount());
                updateExpenseRequest.setDescription("Bill: " + (requestDTO.getDescription() != null ? requestDTO.getDescription() : ""));
                // Note: Category and PaymentMethod are not updated via Bill update for simplicity, can be added if needed.
                expenseService.editExpense(existingExpense.getExpenseId(), updateExpenseRequest, userEmail);
            }
            // If expense not found and creator exists, we could create it, but for simplicity, we'll just skip it
        } else {
            // If no creator, remove any associated expense if it exists
            Optional<Expense> existingExpenseOptional = expenseRepository.findByUserAndDescriptionContaining(user, "Bill: " + existingBill.getDescription());
            existingExpenseOptional.ifPresent(expense -> expenseService.deleteExpense(expense.getExpenseId(), userEmail));
        }

        return convertToDTO(updatedBill);
    }

    @Transactional
    public void deleteBill(Integer billsId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        Bills bill = billsRepository.findByIdAndUser(billsId, user)
                .orElseThrow(() -> new IllegalStateException("Bill not found or access denied."));

        // Find and delete the associated Expense record for the creator's share
        // This is a simplification. In a real app, you might store ExpenseID in Bills table.
        Optional<BillsParticipant> creatorParticipant = bill.getParticipants().stream()
                .filter(BillsParticipant::isCreator)
                .findFirst();

        if (creatorParticipant.isPresent()) {
            // Assuming the expense description contains "Bill: [Bill Description]"
            Optional<Expense> associatedExpense = expenseRepository.findByUserAndDescriptionContaining(user, "Bill: " + bill.getDescription());
            associatedExpense.ifPresent(expense -> expenseService.deleteExpense(expense.getExpenseId(), userEmail));
        }

        billsRepository.delete(bill); // Hard delete
    }

    @Transactional(readOnly = true)
    public BillDTO getSingleBill(Integer billsId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        return billsRepository.findByIdAndUser(billsId, user)
                .map(this::convertToDTO)
                .orElseThrow(() -> new IllegalStateException("Bill not found or access denied."));
    }

    @Transactional(readOnly = true)
    public List<BillDTO> listBills(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        return billsRepository.findAllByUser(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BigDecimal getBillAnalytics(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        List<Bills> userBills = billsRepository.findAllByUser(user);
        BigDecimal totalCreatorShare = BigDecimal.ZERO;

        for (Bills bill : userBills) {
            Optional<BillsParticipant> creatorShare = bill.getParticipants().stream()
                    .filter(BillsParticipant::isCreator)
                    .findFirst();
            if (creatorShare.isPresent()) {
                totalCreatorShare = totalCreatorShare.add(creatorShare.get().getShareAmount());
            }
        }
        return totalCreatorShare;
    }


    // Helper method to convert Bills entity to DTO
    private BillDTO convertToDTO(Bills bill) {
        if (bill == null) {
            return null;
        }

        BillDTO dto = new BillDTO();
        dto.setBillsId(bill.getBillsId());
        dto.setUserId(bill.getUser().getUserId());
        dto.setTotalAmount(bill.getTotalAmount());
        dto.setDescription(bill.getDescription());
        dto.setStatus(bill.getStatus());
        dto.setCreatedAt(bill.getCreatedAt());
        dto.setUpdatedAt(bill.getUpdatedAt());

        // Convert participants
        if (bill.getParticipants() != null) {
            dto.setParticipants(bill.getParticipants().stream()
                    .map(this::convertParticipantToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    // Helper method to convert BillsParticipant entity to DTO
    private BillParticipantDTO convertParticipantToDTO(BillsParticipant participant) {
        if (participant == null) {
            return null;
        }
        BillParticipantDTO dto = new BillParticipantDTO();
        dto.setParticipantId(participant.getParticipantId());
        dto.setParticipantName(participant.getParticipantName());
        dto.setShareAmount(participant.getShareAmount());
        dto.setIsCreator(participant.isCreator()); // Include isCreator flag - use setIsCreator() method
        return dto;
    }
}


