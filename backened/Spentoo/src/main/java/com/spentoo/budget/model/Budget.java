package com.spentoo.budget.model;

import com.spentoo.category.model.Category;
import com.spentoo.user.model.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "Budget")
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BudgetID")
    private Integer budgetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoryID", nullable = false) // Category is required for all budgets
    private Category category;

    @Column(name = "Amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "SpentAmount", nullable = false, precision = 10, scale = 2)
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Column(name = "RemainingAmount", nullable = false, precision = 10, scale = 2)
    private BigDecimal remainingAmount;

    @Column(name = "StartDate", nullable = false)
    private LocalDate startDate;

    @Column(name = "EndDate", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 30)
    private BudgetStatus status = BudgetStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UpdatedAt", nullable = false)
    private LocalDateTime updatedAt;
}
