package com.spentoo.loan.dto;

import com.spentoo.loan.model.LoanType; // Corrected import
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateLoanRequestDTO {

    @NotNull(message = "Loan type is required (TAKEN or GIVEN).")
    private LoanType type;

    @NotBlank(message = "Person name is required.")
    private String personName;

    @NotNull(message = "Original amount is required.")
    @DecimalMin(value = "0.01", message = "Original amount must be greater than 0.")
    private BigDecimal originalAmount;

    private BigDecimal interestRate; // Optional

    private LocalDate startDate; // Optional

    private LocalDate dueDate; // Optional

    private String notes; // Optional
}
