package com.spentoo.recurring.dto;

import com.spentoo.recurring.model.RecurringTransactionFrequency; // Corrected import
import com.spentoo.recurring.model.RecurringTransactionType;     // Corrected import
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateRecurringTransactionRequestDTO {

    @NotBlank(message = "Title is mandatory.")
    private String title;

    private String description;

    @NotNull(message = "Amount is required.")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0.")
    private BigDecimal amount;

    @NotNull(message = "Type is mandatory (INCOME or EXPENSE).")
    private RecurringTransactionType type;

    @NotNull(message = "Frequency is mandatory (DAILY, WEEKLY, MONTHLY, YEARLY).")
    private RecurringTransactionFrequency frequency;

    @NotNull(message = "Next run date is mandatory.")
    @FutureOrPresent(message = "Next run date cannot be in the past.")
    private LocalDate nextRunDate;

    private boolean autoPay = false; // Default to false
}
