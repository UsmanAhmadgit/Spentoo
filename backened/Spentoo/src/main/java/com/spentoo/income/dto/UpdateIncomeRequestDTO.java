package com.spentoo.income.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateIncomeRequestDTO {

    private Integer categoryId; // Allow changing category

    @DecimalMin(value = "0.01", message = "Amount must be greater than 0.")
    private BigDecimal amount; // Optional - if provided, must be positive

    private String source; // Optional

    private String description; // Optional
    
    // Jackson can deserialize ISO-8601 date strings (like "2024-01-15") to LocalDate automatically
    private LocalDate transactionDate; // Optional - allow changing the income date
}
