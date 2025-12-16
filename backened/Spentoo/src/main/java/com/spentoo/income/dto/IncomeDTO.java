package com.spentoo.income.dto;

import com.spentoo.category.dto.CategoryDTO;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class IncomeDTO {

    private Integer incomeId;
    private Integer userId;
    private CategoryDTO category;
    private BigDecimal amount;
    private String source;
    private String description;
    private LocalDate transactionDate; // The date when the income occurred
}
