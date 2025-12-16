package com.spentoo.expense.model;

import com.spentoo.category.model.Category;
import com.spentoo.payment.model.PaymentMethod;
import com.spentoo.user.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "Expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ExpenseID")
    private Integer expenseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoryID", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PaymentMethodID", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "Amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "Description", length = 255)
    private String description;

    @Column(name = "transactionDate", nullable = false)
    private LocalDate transactionDate; // The date when the expense occurred
}
