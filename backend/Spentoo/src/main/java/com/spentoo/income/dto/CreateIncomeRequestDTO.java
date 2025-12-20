package com.spentoo.income.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateIncomeRequestDTO {

    @NotNull(message = "Category ID is required.")
    private Integer categoryId;

    @NotNull(message = "Amount is required.")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0.")
    private BigDecimal amount;

    private String source;

    private String description;

    // Jackson can deserialize ISO-8601 date strings (like "2024-01-15") to LocalDate automatically
    private LocalDate transactionDate; // Optional - defaults to current date if not provided
}
