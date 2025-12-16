package com.spentoo.expense.service;

import com.spentoo.category.dto.CategoryDTO;
import com.spentoo.category.model.Category;
import com.spentoo.category.model.CategoryType;
import com.spentoo.category.repository.CategoryRepository;
import com.spentoo.events.ExpenseChangedEvent;
import com.spentoo.expense.dto.CreateExpenseRequestDTO;
import com.spentoo.expense.dto.ExpenseDTO;
import com.spentoo.expense.dto.UpdateExpenseRequestDTO;
import com.spentoo.expense.model.Expense;
import com.spentoo.expense.repository.ExpenseRepository;
import com.spentoo.payment.dto.PaymentMethodDTO;
import com.spentoo.payment.model.PaymentMethod;
import com.spentoo.payment.repository.PaymentMethodRepository;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final ApplicationEventPublisher eventPublisher; // For publishing events

    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository,
                          CategoryRepository categoryRepository, PaymentMethodRepository paymentMethodRepository,
                          ApplicationEventPublisher eventPublisher) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public ExpenseDTO addExpense(CreateExpenseRequestDTO requestDTO, String userEmail) {
        // 1. Find the user
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        // 2. Find and validate the category - verify user ownership for security
        Category category = categoryRepository.findById(requestDTO.getCategoryId())
                .filter(cat -> cat.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Category not found or access denied."));

        if (!category.isActive()) {
            throw new IllegalStateException("Cannot add expenses to inactive categories.");
        }
        if (!category.isBudgetable()) { // Check if category is budgetable
            throw new IllegalStateException("Expenses cannot be added to non-budgetable categories.");
        }
        if (category.getType() != CategoryType.EXPENSE) {
            throw new IllegalStateException("Transactions can only be added to categories of type EXPENSE.");
        }

        // 3. Handle Payment Method
        PaymentMethod paymentMethod;
        if (requestDTO.getPaymentMethodId() == null) {
            // Default to "Cash" if no payment method is provided - use case-insensitive lookup
            paymentMethod = paymentMethodRepository.findByUserAndNameIgnoreCase(user, "Cash")
                    .orElseThrow(() -> new IllegalStateException("Default 'Cash' payment method not found for user."));
        } else {
            // Find and validate the provided payment method - verify user ownership
            paymentMethod = paymentMethodRepository.findById(requestDTO.getPaymentMethodId())
                    .filter(pm -> pm.getUser().getUserId().equals(user.getUserId()))
                    .filter(pm -> pm.isActive()) // Only allow active payment methods
                    .orElseThrow(() -> new IllegalStateException("Payment method not found, inactive, or access denied."));
        }

        // 4. Validate the amount (already handled by DTO validation, but good to double-check)
        if (requestDTO.getAmount() == null || requestDTO.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Expense amount must be positive.");
        }

        // 5. Create and save the new expense record
        Expense newExpense = new Expense();
        newExpense.setUser(user);
        newExpense.setCategory(category);
        newExpense.setPaymentMethod(paymentMethod);
        newExpense.setAmount(requestDTO.getAmount());
        newExpense.setDescription(requestDTO.getDescription());
        // Set transactionDate - use provided date or default to current date
        newExpense.setTransactionDate(requestDTO.getTransactionDate() != null ? requestDTO.getTransactionDate() : LocalDate.now());

        Expense savedExpense = expenseRepository.save(newExpense);

        // Publish event
        eventPublisher.publishEvent(new ExpenseChangedEvent(this, savedExpense, ExpenseChangedEvent.ChangeType.CREATED));

        // 6. Convert to DTO and return
        return convertToDTO(savedExpense);
    }

    @Transactional
    public ExpenseDTO editExpense(Integer expenseId, UpdateExpenseRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        Expense expense = expenseRepository.findByIdAndUser(expenseId, user)
                .orElseThrow(() -> new IllegalStateException("Expense record not found or access denied."));

        // Update category if provided
        if (requestDTO.getCategoryId() != null) {
            Category newCategory = categoryRepository.findById(requestDTO.getCategoryId())
                    .filter(cat -> cat.getUser().getUserId().equals(user.getUserId()))
                    .filter(cat -> cat.isActive())
                    .filter(cat -> cat.getType() == CategoryType.EXPENSE)
                    .filter(cat -> cat.isBudgetable())
                    .orElseThrow(() -> new IllegalStateException("Category not found, inactive, non-budgetable, or access denied."));
            expense.setCategory(newCategory);
        }

        // Update amount if provided
        if (requestDTO.getAmount() != null) {
            if (requestDTO.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Amount must be positive.");
            }
            expense.setAmount(requestDTO.getAmount());
        }

        // Update description if provided (allow empty string to clear description)
        if (requestDTO.getDescription() != null) {
            expense.setDescription(requestDTO.getDescription().trim().isEmpty() ? null : requestDTO.getDescription().trim());
        }

        // Update transactionDate if provided
        // If transactionDate is provided, use it; otherwise keep the existing date (don't change it)
        if (requestDTO.getTransactionDate() != null) {
            expense.setTransactionDate(requestDTO.getTransactionDate());
        }
        // Note: If transactionDate is null in request, we keep the existing expense transactionDate unchanged

        // Update payment method if provided
        if (requestDTO.getPaymentMethodId() != null) {
            PaymentMethod newPaymentMethod = paymentMethodRepository.findById(requestDTO.getPaymentMethodId())
                    .filter(pm -> pm.getUser().getUserId().equals(user.getUserId()))
                    .filter(pm -> pm.isActive()) // Only allow active payment methods
                    .orElseThrow(() -> new IllegalStateException("Payment method not found, inactive, or access denied."));
            expense.setPaymentMethod(newPaymentMethod);
        }

        Expense updatedExpense = expenseRepository.save(expense);

        // Publish event
        eventPublisher.publishEvent(new ExpenseChangedEvent(this, updatedExpense, ExpenseChangedEvent.ChangeType.UPDATED));

        return convertToDTO(updatedExpense);
    }

    @Transactional
    public void deleteExpense(Integer expenseId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        Expense expense = expenseRepository.findByIdAndUser(expenseId, user)
                .orElseThrow(() -> new IllegalStateException("Expense record not found or access denied."));

        expenseRepository.delete(expense); // Hard delete as per specification

        // Publish event
        eventPublisher.publishEvent(new ExpenseChangedEvent(this, expense, ExpenseChangedEvent.ChangeType.DELETED));
    }

    @Transactional(readOnly = true)
    public ExpenseDTO getSingleExpense(Integer expenseId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        return expenseRepository.findByIdAndUser(expenseId, user)
                .map(this::convertToDTO)
                .orElseThrow(() -> new IllegalStateException("Expense record not found or access denied."));
    }

    @Transactional(readOnly = true)
    public List<ExpenseDTO> listExpenses(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        return expenseRepository.findAllByUser(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    // Helper method to convert Expense entity to DTO
    private ExpenseDTO convertToDTO(Expense expense) {
        if (expense == null) {
            return null;
        }

        ExpenseDTO dto = new ExpenseDTO();
        dto.setExpenseId(expense.getExpenseId());
        dto.setUserId(expense.getUser().getUserId());
        dto.setCategory(convertCategoryToDTO(expense.getCategory()));
        dto.setPaymentMethod(convertPaymentMethodToDTO(expense.getPaymentMethod()));
        dto.setAmount(expense.getAmount());
        dto.setDescription(expense.getDescription());
        
        // Handle transactionDate - use it if present, otherwise fallback to current date
        // This handles migration scenarios where old records might not have transactionDate
        if (expense.getTransactionDate() != null) {
            dto.setTransactionDate(expense.getTransactionDate());
        } else {
            // Fallback to today's date if transactionDate is null (shouldn't happen with new schema)
            dto.setTransactionDate(LocalDate.now());
        }

        return dto;
    }

    // Helper method to convert Category entity to DTO (optimized - no recursive subcategories for expense context)
    private CategoryDTO convertCategoryToDTO(Category category) {
        if (category == null) {
            return null;
        }
        CategoryDTO dto = new CategoryDTO();
        dto.setCategoryId(category.getCategoryId());
        dto.setCategoryName(category.getCategoryName());
        dto.setType(category.getType());
        dto.setIcon(category.getIcon());
        dto.setColor(category.getColor());
        dto.setSortOrder(category.getSortOrder());
        dto.setDefault(category.isDefault());
        dto.setActive(category.isActive());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        if (category.getParentCategory() != null) {
            dto.setParentCategoryId(category.getParentCategory().getCategoryId());
        }
        // Don't include subcategories in expense context to avoid N+1 queries and unnecessary data
        return dto;
    }

    // Helper method to convert PaymentMethod entity to DTO (similar to PaymentMethodService)
    private PaymentMethodDTO convertPaymentMethodToDTO(PaymentMethod paymentMethod) {
        if (paymentMethod == null) {
            return null;
        }
        PaymentMethodDTO dto = new PaymentMethodDTO();
        dto.setMethodId(paymentMethod.getMethodId());
        dto.setUserId(paymentMethod.getUser().getUserId());
        dto.setName(paymentMethod.getName());
        dto.setProvider(paymentMethod.getProvider());
        dto.setAccountNumberMasked(paymentMethod.getAccountNumberMasked());
        dto.setActive(paymentMethod.isActive());
        dto.setCreatedAt(paymentMethod.getCreatedAt());
        dto.setUpdatedAt(paymentMethod.getUpdatedAt());
        return dto;
    }
}
