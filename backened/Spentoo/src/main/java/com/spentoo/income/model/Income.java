package com.spentoo.income.model;

import com.spentoo.category.model.Category;
import com.spentoo.user.model.User;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "Income")
public class Income {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IncomeID")
    private Integer incomeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoryID", nullable = false)
    private Category category;

    @Column(name = "Amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "Source", length = 100)
    private String source;

    @Column(name = "Description", length = 255)
    private String description;

    @Column(name = "transactionDate", nullable = false)
    private LocalDate transactionDate; // The date when the income occurred
}
