package com.spentoo.recurring.dto;

import com.spentoo.category.dto.CategoryDTO;
import com.spentoo.recurring.model.RecurringTransactionFrequency; // Corrected import
import com.spentoo.recurring.model.RecurringTransactionType;     // Corrected import
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class RecurringTransactionDTO {

    private Integer recurringId;
    private Integer userId;
    private CategoryDTO category; // The system-generated "Recurring Payments" category
    private String title;
    private String description;
    private BigDecimal amount;
    private RecurringTransactionType type;
    private RecurringTransactionFrequency frequency;
    private LocalDate nextRunDate;
    private boolean autoPay;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
