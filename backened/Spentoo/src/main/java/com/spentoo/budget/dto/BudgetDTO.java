package com.spentoo.budget.dto;

import com.spentoo.budget.model.BudgetStatus; // Corrected import
import com.spentoo.category.dto.CategoryDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class BudgetDTO {

    private Integer budgetId;
    private Integer userId;
    private CategoryDTO category;
    private BigDecimal amount;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private BudgetStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
