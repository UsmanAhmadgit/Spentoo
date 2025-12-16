package com.spentoo.expense.dto;

import com.spentoo.category.dto.CategoryDTO;
import com.spentoo.payment.dto.PaymentMethodDTO;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseDTO {

    private Integer expenseId;
    private Integer userId;
    private CategoryDTO category;
    private PaymentMethodDTO paymentMethod;
    private BigDecimal amount;
    private String description;
    private LocalDate transactionDate; // The date when the expense occurred
}
