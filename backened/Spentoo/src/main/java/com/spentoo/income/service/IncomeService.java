package com.spentoo.income.service;

import com.spentoo.category.dto.CategoryDTO;
import com.spentoo.category.model.Category;
import com.spentoo.category.model.CategoryType;
import com.spentoo.category.repository.CategoryRepository;
import com.spentoo.income.dto.CreateIncomeRequestDTO;
import com.spentoo.income.dto.IncomeDTO;
import com.spentoo.income.dto.UpdateIncomeRequestDTO;
import com.spentoo.income.model.Income;
import com.spentoo.income.repository.IncomeRepository;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public IncomeService(IncomeRepository incomeRepository, UserRepository userRepository, CategoryRepository categoryRepository) {
        this.incomeRepository = incomeRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public IncomeDTO addIncome(CreateIncomeRequestDTO requestDTO, String userEmail) {
        // 1. Find the user
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        // 2. Find and validate the category - verify user ownership for security
        Category category = categoryRepository.findById(requestDTO.getCategoryId())
                .filter(cat -> cat.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Category not found or access denied."));

        if (!category.isActive()) {
            throw new IllegalStateException("Cannot add income to inactive categories.");
        }
        if (category.getType() != CategoryType.INCOME) {
            throw new IllegalStateException("Transactions can only be added to categories of type INCOME.");
        }

        // 3. Validate the amount
        if (requestDTO.getAmount() == null || requestDTO.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Income amount must be positive.");
        }

        // 4. Create and save the new income record
        Income newIncome = new Income();
        newIncome.setUser(user);
        newIncome.setCategory(category);
        newIncome.setAmount(requestDTO.getAmount());
        newIncome.setSource(requestDTO.getSource());
        newIncome.setDescription(requestDTO.getDescription());
        // Set transactionDate - use provided date or default to current date
        newIncome.setTransactionDate(requestDTO.getTransactionDate() != null ? requestDTO.getTransactionDate() : LocalDate.now());

        Income savedIncome = incomeRepository.save(newIncome);
        return convertToDTO(savedIncome);
    }

    @Transactional
    public IncomeDTO editIncome(Integer incomeId, UpdateIncomeRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        Income income = incomeRepository.findByIdAndUser(incomeId, user)
                .orElseThrow(() -> new IllegalStateException("Income record not found or access denied."));

        // Update category if provided
        if (requestDTO.getCategoryId() != null) {
            Category newCategory = categoryRepository.findById(requestDTO.getCategoryId())
                    .filter(cat -> cat.getUser().getUserId().equals(user.getUserId()))
                    .filter(cat -> cat.isActive())
                    .filter(cat -> cat.getType() == CategoryType.INCOME)
                    .orElseThrow(() -> new IllegalStateException("Category not found, inactive, or access denied."));
            income.setCategory(newCategory);
        }

        // Update amount if provided
        if (requestDTO.getAmount() != null) {
            if (requestDTO.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Income amount must be positive.");
            }
            income.setAmount(requestDTO.getAmount());
        }

        // Update source if provided
        if (requestDTO.getSource() != null) {
            income.setSource(requestDTO.getSource().trim().isEmpty() ? null : requestDTO.getSource().trim());
        }

        // Update description if provided (allow empty string to clear description)
        if (requestDTO.getDescription() != null) {
            income.setDescription(requestDTO.getDescription().trim().isEmpty() ? null : requestDTO.getDescription().trim());
        }

        // Update transactionDate if provided
        if (requestDTO.getTransactionDate() != null) {
            income.setTransactionDate(requestDTO.getTransactionDate());
        }
        // Note: If transactionDate is null in request, we keep the existing income date unchanged

        Income updatedIncome = incomeRepository.save(income);
        return convertToDTO(updatedIncome);
    }

    @Transactional
    public void deleteIncome(Integer incomeId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        Income income = incomeRepository.findByIdAndUser(incomeId, user)
                .orElseThrow(() -> new IllegalStateException("Income record not found or access denied."));

        incomeRepository.delete(income);
    }

    @Transactional(readOnly = true)
    public IncomeDTO getSingleIncome(Integer incomeId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        return incomeRepository.findByIdAndUser(incomeId, user)
                .map(this::convertToDTO)
                .orElseThrow(() -> new IllegalStateException("Income record not found or access denied."));
    }

    @Transactional(readOnly = true)
    public List<IncomeDTO> listIncomes(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        return incomeRepository.findAllByUser(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private IncomeDTO convertToDTO(Income income) {
        if (income == null) {
            return null;
        }
        IncomeDTO dto = new IncomeDTO();
        dto.setIncomeId(income.getIncomeId());
        dto.setUserId(income.getUser().getUserId());
        dto.setCategory(convertCategoryToDTO(income.getCategory()));
        dto.setAmount(income.getAmount());
        dto.setSource(income.getSource());
        dto.setDescription(income.getDescription());
        dto.setTransactionDate(income.getTransactionDate());
        return dto;
    }

    // Helper method to convert Category entity to DTO (optimized - no recursive subcategories for income context)
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
        // Don't include subcategories in income context to avoid N+1 queries and unnecessary data
        return dto;
    }
}
