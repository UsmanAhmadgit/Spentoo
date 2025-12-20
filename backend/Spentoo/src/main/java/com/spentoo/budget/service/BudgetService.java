package com.spentoo.budget.service;

import com.spentoo.budget.dto.BudgetDTO;
import com.spentoo.budget.dto.CreateBudgetRequestDTO;
import com.spentoo.budget.dto.UpdateBudgetRequestDTO;
import com.spentoo.budget.model.Budget;
import com.spentoo.budget.model.BudgetStatus;
import com.spentoo.budget.repository.BudgetRepository;
import com.spentoo.category.dto.CategoryDTO;
import com.spentoo.category.model.Category;
import com.spentoo.category.repository.CategoryRepository;
import com.spentoo.events.ExpenseChangedEvent;
import com.spentoo.expense.model.Expense;
import com.spentoo.expense.repository.ExpenseRepository;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    public BudgetService(BudgetRepository budgetRepository, UserRepository userRepository,
                         CategoryRepository categoryRepository, ExpenseRepository expenseRepository) {
        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.expenseRepository = expenseRepository;
    }

    @Transactional
    public BudgetDTO createBudget(CreateBudgetRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        // Find and validate the category - verify user ownership for security
        Category category = categoryRepository.findById(requestDTO.getCategoryId())
                .filter(cat -> cat.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Category not found or access denied."));

        if (!category.isActive()) {
            throw new IllegalStateException("Cannot create budget for inactive categories.");
        }

        if (!category.isBudgetable()) {
            throw new IllegalStateException("Budgets cannot be set for non-budgetable categories (e.g., savings, goals).");
        }

        Budget newBudget = new Budget();
        newBudget.setUser(user);
        newBudget.setCategory(category);
        newBudget.setAmount(requestDTO.getAmount());
        newBudget.setStartDate(requestDTO.getStartDate());
        newBudget.setEndDate(requestDTO.getEndDate());
        newBudget.setStatus(BudgetStatus.ACTIVE);

        // Initial calculation
        recalculateBudget(newBudget);

        Budget savedBudget = budgetRepository.save(newBudget);
        return convertToDTO(savedBudget);
    }

    @Transactional
    public BudgetDTO updateBudget(Integer budgetId, UpdateBudgetRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        Budget budget = budgetRepository.findByIdAndUser(budgetId, user)
                .orElseThrow(() -> new IllegalStateException("Budget not found or access denied."));

        boolean needsRecalculation = false;

        if (requestDTO.getCategoryId() != null && !requestDTO.getCategoryId().equals(budget.getCategory().getCategoryId())) {
            Category newCategory = categoryRepository.findById(requestDTO.getCategoryId())
                    .filter(cat -> cat.getUser().getUserId().equals(user.getUserId()))
                    .filter(cat -> cat.isActive())
                    .orElseThrow(() -> new IllegalStateException("Category not found, inactive, or access denied."));
            if (!newCategory.isBudgetable()) {
                throw new IllegalStateException("Budgets cannot be set for non-budgetable categories.");
            }
            budget.setCategory(newCategory);
            needsRecalculation = true;
        }
        if (requestDTO.getAmount() != null) {
            budget.setAmount(requestDTO.getAmount());
            needsRecalculation = true;
        }
        if (requestDTO.getStartDate() != null) {
            budget.setStartDate(requestDTO.getStartDate());
            needsRecalculation = true;
        }
        if (requestDTO.getEndDate() != null) {
            budget.setEndDate(requestDTO.getEndDate());
            needsRecalculation = true;
        }
        if (requestDTO.getStatus() != null) {
            budget.setStatus(requestDTO.getStatus());
        }

        if (needsRecalculation) {
            recalculateBudget(budget);
        }

        Budget updatedBudget = budgetRepository.save(budget);
        return convertToDTO(updatedBudget);
    }

    @Transactional
    public void deleteBudget(Integer budgetId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        Budget budget = budgetRepository.findByIdAndUser(budgetId, user)
                .orElseThrow(() -> new IllegalStateException("Budget not found or access denied."));

        budgetRepository.delete(budget);
    }

    @Transactional(readOnly = true)
    public BudgetDTO getSingleBudget(Integer budgetId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        return budgetRepository.findByIdAndUser(budgetId, user)
                .map(this::convertToDTO)
                .orElseThrow(() -> new IllegalStateException("Budget not found or access denied."));
    }

    @Transactional(readOnly = true)
    public List<BudgetDTO> getAllBudgets(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        return budgetRepository.findAllByUser(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    @EventListener
    @Transactional
    public void handleExpenseChangedEvent(ExpenseChangedEvent event) {
        Expense expense = event.getExpense();
        User user = expense.getUser();
        Category category = expense.getCategory();
        LocalDate expenseDate = expense.getTransactionDate(); // Use transactionDate instead of createdAt

        // Find all budgets affected by this expense change
        List<Budget> affectedBudgets = budgetRepository.findAllByUserAndCategoryAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                user, category, expenseDate
        );

        // Recalculate all affected budgets
        for (Budget budget : affectedBudgets) {
            recalculateBudget(budget);
        }
    }

    private void recalculateBudget(Budget budget) {
        // Fetch all expenses for the user, category, and date range of the budget
        List<Expense> expensesInPeriod = expenseRepository.findAllByUserAndCategoryAndTransactionDateBetween(
                budget.getUser(), budget.getCategory(), budget.getStartDate(), budget.getEndDate()
        );

        // Sum the amounts of these expenses
        BigDecimal totalSpent = expensesInPeriod.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Update the spentAmount and remainingAmount
        budget.setSpentAmount(totalSpent);
        budget.setRemainingAmount(budget.getAmount().subtract(totalSpent));

        // Update the status
        if (budget.getEndDate().isBefore(LocalDate.now())) {
            budget.setStatus(totalSpent.compareTo(budget.getAmount()) > 0 ? BudgetStatus.OVER_BUDGET : BudgetStatus.COMPLETED);
        } else {
            budget.setStatus(totalSpent.compareTo(budget.getAmount()) > 0 ? BudgetStatus.OVER_BUDGET : BudgetStatus.ACTIVE);
        }
    }

    // Helper method to convert Budget entity to DTO
    private BudgetDTO convertToDTO(Budget budget) {
        if (budget == null) {
            return null;
        }

        BudgetDTO dto = new BudgetDTO();
        dto.setBudgetId(budget.getBudgetId());
        dto.setUserId(budget.getUser().getUserId());
        dto.setCategory(convertCategoryToDTO(budget.getCategory()));
        dto.setAmount(budget.getAmount());
        dto.setSpentAmount(budget.getSpentAmount());
        dto.setRemainingAmount(budget.getRemainingAmount());
        dto.setStartDate(budget.getStartDate());
        dto.setEndDate(budget.getEndDate());
        dto.setStatus(budget.getStatus());
        dto.setCreatedAt(budget.getCreatedAt());
        dto.setUpdatedAt(budget.getUpdatedAt());

        return dto;
    }

    // Helper method to convert Category entity to DTO (optimized - no recursive subcategories for budget context)
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
        // Don't include subcategories in budget context to avoid N+1 queries and unnecessary data
        return dto;
    }
}
