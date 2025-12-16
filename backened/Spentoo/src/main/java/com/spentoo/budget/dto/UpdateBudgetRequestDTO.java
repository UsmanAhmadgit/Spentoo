package com.spentoo.budget.dto;

import com.spentoo.budget.model.BudgetStatus; // Corrected import
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateBudgetRequestDTO {

    private Integer categoryId;

    @DecimalMin(value = "0.01", message = "Amount must be greater than 0.")
    private BigDecimal amount;

    private LocalDate startDate;

    private LocalDate endDate;

    private BudgetStatus status;
}
