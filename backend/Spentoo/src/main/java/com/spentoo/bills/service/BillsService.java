package com.spentoo.bills.service;

import com.spentoo.bills.dto.BillDTO;
import com.spentoo.bills.dto.BillParticipantDTO;
import com.spentoo.bills.dto.CreateBillRequestDTO;
import com.spentoo.bills.dto.UpdateBillRequestDTO;
import com.spentoo.bills.model.Bills;
import com.spentoo.bills.model.BillsParticipant;
import com.spentoo.bills.repository.BillsParticipantRepository;
import com.spentoo.bills.repository.BillsRepository;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

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
    
    @PersistenceContext
    private EntityManager entityManager;

    public BillsService(BillsRepository billsRepository, BillsParticipantRepository billsParticipantRepository,
                        UserRepository userRepository) {
        this.billsRepository = billsRepository;
        this.billsParticipantRepository = billsParticipantRepository;
        this.userRepository = userRepository;
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
        }
        // If no participants, creator validation is skipped (participants are optional)

        // 4. Create and save the Bill
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
        // Set initial status based on request
        newBill.setStatus(requestDTO.getStatus() != null ? requestDTO.getStatus() : "Unpaid");
        Bills savedBill = billsRepository.save(newBill);

        // 7. Create and save Participants (only if provided)
        List<BillsParticipant> savedParticipants = new java.util.ArrayList<>();
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
                BillsParticipant savedParticipant = billsParticipantRepository.save(participant);
                savedParticipants.add(savedParticipant);
            }
            entityManager.flush(); // Ensure participants are persisted
        }

        // 5. Convert to DTO and return - manually set participants to ensure they're included
        BillDTO result = convertToDTO(savedBill);
        if (!savedParticipants.isEmpty()) {
            List<BillParticipantDTO> participantDTOs = savedParticipants.stream()
                    .map(this::convertParticipantToDTO)
                    .collect(Collectors.toList());
            result.setParticipants(participantDTOs);
        }
        return result;
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
        }

        // 3. Update Bill details
        existingBill.setTotalAmount(requestDTO.getTotalAmount());
        existingBill.setDescription(requestDTO.getDescription());

        // 4. Update Participants (only if provided)
        if (requestDTO.getParticipants() != null) {
            // Get current participants - ensure it's initialized
            Set<BillsParticipant> currentParticipants = existingBill.getParticipants();
            if (currentParticipants == null) {
                currentParticipants = new java.util.HashSet<>();
                existingBill.setParticipants(currentParticipants);
            } else {
                // Force initialization of lazy collection by accessing size
                currentParticipants.size();
            }
            
            if (requestDTO.getParticipants().isEmpty()) {
                // If empty list provided, remove all participants
                currentParticipants.clear();
            } else {
                // Get IDs of participants that should be kept (those with IDs in the request)
                Set<Integer> participantIdsToKeep = requestDTO.getParticipants().stream()
                        .filter(pDto -> pDto.getParticipantId() != null)
                        .map(BillParticipantDTO::getParticipantId)
                        .collect(Collectors.toSet());

                // Remove participants not in the new list (only those with IDs)
                currentParticipants.removeIf(p -> p.getParticipantId() != null && !participantIdsToKeep.contains(p.getParticipantId()));

                // Update or add participants
                for (BillParticipantDTO pDto : requestDTO.getParticipants()) {
                    // Use isCreator flag from frontend
                    boolean isCreator = pDto.isCreator();
                    
                    if (pDto.getParticipantId() != null) {
                        // Update existing participant
                        BillsParticipant participant = currentParticipants.stream()
                                .filter(p -> p.getParticipantId() != null && p.getParticipantId().equals(pDto.getParticipantId()))
                                .findFirst()
                                .orElseThrow(() -> new IllegalStateException("Participant not found: " + pDto.getParticipantId()));
                        participant.setParticipantName(pDto.getParticipantName());
                        participant.setShareAmount(pDto.getShareAmount());
                        // Use isCreator flag from frontend
                        participant.setCreator(isCreator);
                    } else {
                        // Add new participant - let cascade handle the save
                        BillsParticipant newParticipant = new BillsParticipant();
                        newParticipant.setBill(existingBill);
                        newParticipant.setParticipantName(pDto.getParticipantName());
                        newParticipant.setShareAmount(pDto.getShareAmount());
                        // Use isCreator flag from frontend
                        newParticipant.setCreator(isCreator);
                        // Add to the Set - cascade will handle persistence
                        currentParticipants.add(newParticipant);
                    }
                }
            }
        }
        
        // Update bill status if provided
        if (requestDTO.getStatus() != null) {
            existingBill.setStatus(requestDTO.getStatus());
        }

        Bills updatedBill = billsRepository.save(existingBill);
        entityManager.flush(); // Ensure all changes are persisted
        entityManager.clear(); // Clear persistence context to force fresh load

        // 5. Reload bill with participants to ensure they're included in response
        Bills billWithParticipants = billsRepository.findByIdAndUser(updatedBill.getBillsId(), user)
                .orElseThrow(() -> new IllegalStateException("Bill not found after update."));

        // 6. Convert to DTO and return - use reloaded bill with participants
        return convertToDTO(billWithParticipants);
    }

    @Transactional
    public void deleteBill(Integer billsId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        Bills bill = billsRepository.findByIdAndUser(billsId, user)
                .orElseThrow(() -> new IllegalStateException("Bill not found or access denied."));

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
    public List<BillDTO> listBillsLastWeek(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate lastWeekStart = today.minusDays(6);
        java.time.LocalDate lastWeekEnd = today;

        return billsRepository.findAllByUserAndCreatedAtDateBetween(user, lastWeekStart, lastWeekEnd)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillDTO> listBillsLastMonth(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate lastMonthStart = today.minusMonths(1).with(java.time.temporal.TemporalAdjusters.firstDayOfMonth());
        java.time.LocalDate lastMonthEnd = today.minusMonths(1).with(java.time.temporal.TemporalAdjusters.lastDayOfMonth());

        return billsRepository.findAllByUserAndCreatedAtDateBetween(user, lastMonthStart, lastMonthEnd)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillDTO> listBillsLastYear(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate lastYearStart = today.minusDays(365);
        java.time.LocalDate lastYearEnd = today;

        return billsRepository.findAllByUserAndCreatedAtDateBetween(user, lastYearStart, lastYearEnd)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillDTO> listBillsByDateRange(String userEmail, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        if (endDate.isBefore(startDate)) {
            throw new IllegalStateException("End date cannot be before start date.");
        }

        return billsRepository.findAllByUserAndCreatedAtDateBetween(user, startDate, endDate)
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


