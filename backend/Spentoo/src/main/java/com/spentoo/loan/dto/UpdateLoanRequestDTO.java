package com.spentoo.loan.dto;

import com.spentoo.loan.model.LoanStatus; // Corrected import
import com.spentoo.loan.model.LoanType; // Added for type update
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateLoanRequestDTO {

    private String personName; // Optional - only required when updating person name

    private BigDecimal originalAmount; // Allow updating original amount

    private LoanType type; // Allow updating loan type (TAKEN/GIVEN)

    private BigDecimal interestRate;

    private LocalDate dueDate;

    private String notes;

    private LoanStatus status; // To allow status toggle (ACTIVE/CLOSED)
}
