package com.spentoo.loan.dto;

import com.spentoo.loan.model.LoanStatus; // Corrected import
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateLoanRequestDTO {

    @NotBlank(message = "Person name cannot be empty.")
    private String personName;

    private BigDecimal interestRate;

    private LocalDate dueDate;

    private String notes;

    private LoanStatus status; // To allow manual closing if RemainingAmount == 0
}
