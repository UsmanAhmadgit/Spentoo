package com.spentoo.recurring.service;

import com.spentoo.category.model.Category;
import com.spentoo.category.repository.CategoryRepository;
import com.spentoo.category.service.CategoryService; // Import CategoryService
import com.spentoo.expense.dto.CreateExpenseRequestDTO;
import com.spentoo.expense.service.ExpenseService;
import com.spentoo.income.dto.CreateIncomeRequestDTO;
import com.spentoo.income.service.IncomeService;
import com.spentoo.payment.model.PaymentMethod;
import com.spentoo.payment.repository.PaymentMethodRepository;
import com.spentoo.recurring.dto.CreateRecurringTransactionRequestDTO;
import com.spentoo.recurring.dto.RecurringTransactionDTO;
import com.spentoo.recurring.dto.UpdateRecurringTransactionRequestDTO;
import com.spentoo.recurring.model.RecurringTransaction;
import com.spentoo.recurring.model.RecurringTransactionFrequency;
import com.spentoo.recurring.model.RecurringTransactionType;
import com.spentoo.recurring.repository.RecurringTransactionRepository;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecurringTransactionService {

    private final RecurringTransactionRepository recurringTransactionRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final ExpenseService expenseService;
    private final IncomeService incomeService;
    private final CategoryService categoryService; // Inject CategoryService

    public RecurringTransactionService(RecurringTransactionRepository recurringTransactionRepository,
                                       UserRepository userRepository, CategoryRepository categoryRepository,
                                       PaymentMethodRepository paymentMethodRepository, ExpenseService expenseService,
                                       IncomeService incomeService, CategoryService categoryService) { // Add CategoryService to constructor
        this.recurringTransactionRepository = recurringTransactionRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.expenseService = expenseService;
        this.incomeService = incomeService;
        this.categoryService = categoryService; // Assign CategoryService
    }

    @Transactional
    public RecurringTransactionDTO createRecurringTransaction(CreateRecurringTransactionRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        // Get the system-generated "Recurring Payments" category
        Category recurringCategory = categoryRepository.findByUserAndCategoryNameIgnoreCaseAndIsSystemGenerated(user, "Recurring Payments", true)
                .orElseThrow(() -> new IllegalStateException("System-generated 'Recurring Payments' category not found for user."));

        // Validate nextRunDate (already handled by @FutureOrPresent, but good to ensure logic)
        LocalDate nextRunDate = requestDTO.getNextRunDate();
        if (nextRunDate.isBefore(LocalDate.now())) {
            nextRunDate = LocalDate.now().plusDays(1); // Reset to tomorrow if somehow in past
        }

        RecurringTransaction newRecurring = new RecurringTransaction();
        newRecurring.setUser(user);
        newRecurring.setCategory(recurringCategory);
        newRecurring.setTitle(requestDTO.getTitle());
        newRecurring.setAmount(requestDTO.getAmount());
        newRecurring.setType(requestDTO.getType());
        newRecurring.setFrequency(requestDTO.getFrequency());
        newRecurring.setNextRunDate(nextRunDate);
        newRecurring.setAutoPay(requestDTO.isAutoPay());

        RecurringTransaction savedRecurring = recurringTransactionRepository.save(newRecurring);
        return convertToDTO(savedRecurring);
    }

    @Transactional
    public RecurringTransactionDTO updateRecurringTransaction(Integer recurringId, UpdateRecurringTransactionRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        RecurringTransaction recurring = recurringTransactionRepository.findById(recurringId)
                .filter(rt -> rt.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Recurring transaction not found or access denied."));

        if (requestDTO.getTitle() != null) {
            recurring.setTitle(requestDTO.getTitle());
        }
        if (requestDTO.getAmount() != null) {
            recurring.setAmount(requestDTO.getAmount());
        }
        if (requestDTO.getType() != null) {
            recurring.setType(requestDTO.getType());
        }
        if (requestDTO.getFrequency() != null) {
            recurring.setFrequency(requestDTO.getFrequency());
        }
        if (requestDTO.getNextRunDate() != null) {
            // If user changes nextRunDate to past, system resets it to tomorrow (or current date if today)
            LocalDate newNextRunDate = requestDTO.getNextRunDate();
            if (newNextRunDate.isBefore(LocalDate.now())) {
                newNextRunDate = LocalDate.now(); // If user sets to past, set to today
            }
            recurring.setNextRunDate(newNextRunDate);
        }
        if (requestDTO.getAutoPay() != null) {
            recurring.setAutoPay(requestDTO.getAutoPay()); // Corrected
        }

        RecurringTransaction updatedRecurring = recurringTransactionRepository.save(recurring);
        return convertToDTO(updatedRecurring);
    }

    @Transactional
    public void deleteRecurringTransaction(Integer recurringId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        RecurringTransaction recurring = recurringTransactionRepository.findById(recurringId)
                .filter(rt -> rt.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Recurring transaction not found or access denied."));

        recurringTransactionRepository.delete(recurring); // Hard delete
    }

    @Transactional(readOnly = true)
    public RecurringTransactionDTO getRecurringTransaction(Integer recurringId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        return recurringTransactionRepository.findById(recurringId)
                .filter(rt -> rt.getUser().getUserId().equals(user.getUserId()))
                .map(this::convertToDTO)
                .orElseThrow(() -> new IllegalStateException("Recurring transaction not found or access denied."));
    }

    @Transactional(readOnly = true)
    public List<RecurringTransactionDTO> listRecurringTransactions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        return recurringTransactionRepository.findAllByUser(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void pauseRecurringTransaction(Integer recurringId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        RecurringTransaction recurring = recurringTransactionRepository.findById(recurringId)
                .filter(rt -> rt.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Recurring transaction not found or access denied."));
        
        recurring.setAutoPay(false);
        recurringTransactionRepository.save(recurring);
    }

    @Transactional
    public void resumeRecurringTransaction(Integer recurringId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        RecurringTransaction recurring = recurringTransactionRepository.findById(recurringId)
                .filter(rt -> rt.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Recurring transaction not found or access denied."));
        
        // Trigger the transaction immediately when resuming
        processSingleRecurringTransaction(recurring);
        
        // Resume the transaction (set autoPay = true)
        recurring.setAutoPay(true);
        
        // Update nextRunDate based on frequency
        recurring.setNextRunDate(calculateNextRunDate(recurring.getNextRunDate(), recurring.getFrequency()));
        recurring.setUpdatedAt(LocalDateTime.now());
        recurringTransactionRepository.save(recurring);
    }

    @Transactional
    public void manuallyTriggerPayment(Integer recurringId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        RecurringTransaction recurring = recurringTransactionRepository.findById(recurringId)
                .filter(rt -> rt.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Recurring transaction not found or access denied."));

        // Trigger the transaction immediately
        processSingleRecurringTransaction(recurring);

        // When Run Now is clicked, automatically resume the transaction (set autoPay = true)
        recurring.setAutoPay(true);
        
        // Update nextRunDate based on frequency
        recurring.setNextRunDate(calculateNextRunDate(recurring.getNextRunDate(), recurring.getFrequency()));
        recurring.setUpdatedAt(LocalDateTime.now());
        recurringTransactionRepository.save(recurring);
    }


    // Cron Job Logic
    @Scheduled(cron = "0 0 0 * * *") // Runs every day at midnight (00:00)
    @Transactional
    public void processDueRecurringTransactions() {
        LocalDate today = LocalDate.now();
        List<RecurringTransaction> dueTransactions = recurringTransactionRepository.findAllByNextRunDate(today);

        for (RecurringTransaction recurring : dueTransactions) {
            // Handle edge case: cron job misses a day or user changes nextRunDate to past
            // If nextRunDate < today, fire once immediately and then move forward
            if (recurring.getNextRunDate().isBefore(today)) {
                processSingleRecurringTransaction(recurring); // Fire for the missed day
                recurring.setNextRunDate(calculateNextRunDate(recurring.getNextRunDate(), recurring.getFrequency())); // Move forward
            } else {
                processSingleRecurringTransaction(recurring); // Fire for today
            }

            // Update nextRunDate based on frequency
            recurring.setNextRunDate(calculateNextRunDate(recurring.getNextRunDate(), recurring.getFrequency()));
            recurring.setUpdatedAt(LocalDateTime.now());
            recurringTransactionRepository.save(recurring);
        }
    }

    private void processSingleRecurringTransaction(RecurringTransaction recurring) {
        // Get the system-generated "RECURRING_AUTO_PAY" payment method
        PaymentMethod autoPayMethod = paymentMethodRepository.findByUserAndNameAndIsSystemGenerated(recurring.getUser(), "RECURRING_AUTO_PAY", true)
                .orElseThrow(() -> new IllegalStateException("System-generated 'RECURRING_AUTO_PAY' payment method not found for user: " + recurring.getUser().getEmail()));

        if (recurring.getType() == RecurringTransactionType.EXPENSE) {
            CreateExpenseRequestDTO expenseRequest = new CreateExpenseRequestDTO();
            expenseRequest.setCategoryId(recurring.getCategory().getCategoryId());
            expenseRequest.setPaymentMethodId(autoPayMethod.getMethodId());
            expenseRequest.setAmount(recurring.getAmount());
            expenseRequest.setDescription(recurring.getTitle());
            expenseService.addExpense(expenseRequest, recurring.getUser().getEmail());
        } else if (recurring.getType() == RecurringTransactionType.INCOME) {
            CreateIncomeRequestDTO incomeRequest = new CreateIncomeRequestDTO();
            incomeRequest.setCategoryId(recurring.getCategory().getCategoryId());
            incomeRequest.setAmount(recurring.getAmount());
            incomeRequest.setSource(recurring.getTitle());
            incomeRequest.setDescription(recurring.getTitle());
            incomeService.addIncome(incomeRequest, recurring.getUser().getEmail());
        }
    }

    private LocalDate calculateNextRunDate(LocalDate currentRunDate, RecurringTransactionFrequency frequency) {
        return switch (frequency) { // Enhanced switch
            case DAILY -> currentRunDate.plusDays(1);
            case WEEKLY -> currentRunDate.plusWeeks(1);
            case MONTHLY -> currentRunDate.plusMonths(1);
            case YEARLY -> currentRunDate.plusYears(1);
            default -> throw new IllegalStateException("Unknown frequency: " + frequency);
        };
    }


    // Helper method to convert RecurringTransaction entity to DTO
    private RecurringTransactionDTO convertToDTO(RecurringTransaction recurring) {
        if (recurring == null) {
            return null;
        }

        RecurringTransactionDTO dto = new RecurringTransactionDTO();
        dto.setRecurringId(recurring.getRecurringId());
        dto.setUserId(recurring.getUser().getUserId());
        dto.setCategory(categoryService.convertToDTO(recurring.getCategory())); // Use CategoryService to convert
        dto.setTitle(recurring.getTitle());
        dto.setDescription(null); // Description not in database schema
        dto.setAmount(recurring.getAmount());
        dto.setType(recurring.getType());
        dto.setFrequency(recurring.getFrequency());
        dto.setNextRunDate(recurring.getNextRunDate());
        dto.setAutoPay(recurring.isAutoPay());
        dto.setCreatedAt(recurring.getCreatedAt());
        dto.setUpdatedAt(recurring.getUpdatedAt());

        return dto;
    }
}
