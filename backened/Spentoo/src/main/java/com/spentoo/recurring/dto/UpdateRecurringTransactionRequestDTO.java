package com.spentoo.recurring.dto;

import com.spentoo.recurring.model.RecurringTransactionFrequency; // Corrected import
import com.spentoo.recurring.model.RecurringTransactionType;     // Corrected import
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateRecurringTransactionRequestDTO {

    private String title;

    private String description;

    @DecimalMin(value = "0.01", message = "Amount must be greater than 0.")
    private BigDecimal amount;

    private RecurringTransactionType type;

    private RecurringTransactionFrequency frequency;

    @FutureOrPresent(message = "Next run date cannot be in the past.")
    private LocalDate nextRunDate;

    private Boolean autoPay;
}
