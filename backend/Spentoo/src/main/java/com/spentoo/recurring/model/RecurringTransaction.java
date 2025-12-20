package com.spentoo.recurring.model;

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
@Table(name = "RecurringTransaction") // Renamed from RecurringTransactions as per DB change
public class RecurringTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RecurringID")
    private Integer recurringId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoryID", nullable = false)
    private Category category; // Always the system-generated "Recurring Payments" category

    @Column(name = "Title", nullable = false, length = 150)
    private String title;

    @Column(name = "Amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false, length = 20)
    private RecurringTransactionType type; // INCOME or EXPENSE

    @Enumerated(EnumType.STRING)
    @Column(name = "Frequency", nullable = false, length = 20)
    private RecurringTransactionFrequency frequency; // DAILY, WEEKLY, MONTHLY, YEARLY

    @Column(name = "NextRunDate", nullable = false)
    private LocalDate nextRunDate;

    @Column(name = "AutoPay", nullable = false)
    private boolean autoPay = false;

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UpdatedAt", nullable = false)
    private LocalDateTime updatedAt;
}
