package com.spentoo.expense.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateExpenseRequestDTO {

    private Integer categoryId; // Allow changing category

    @DecimalMin(value = "0.01", message = "Amount must be greater than 0.")
    private BigDecimal amount;

    private String description;

    private Integer paymentMethodId;

    // Jackson can deserialize ISO-8601 date strings (like "2024-01-15") to LocalDate automatically
    private LocalDate transactionDate; // Allow changing the expense transaction date
}
