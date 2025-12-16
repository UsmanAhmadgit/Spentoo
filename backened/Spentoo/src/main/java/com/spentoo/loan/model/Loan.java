package com.spentoo.loan.model;

import com.spentoo.user.model.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Entity
@Table(name = "Loan")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LoanID")
    private Integer loanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false, length = 20)
    private LoanType type;

    @Column(name = "PersonName", nullable = false, length = 100)
    private String personName;

    @Column(name = "OriginalAmount", nullable = false, precision = 10, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "RemainingAmount", nullable = false, precision = 10, scale = 2)
    private BigDecimal remainingAmount;

    @Column(name = "InterestRate", precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(name = "StartDate")
    private LocalDate startDate;

    @Column(name = "DueDate")
    private LocalDate dueDate;

    @Column(name = "Notes", length = 255) // Changed from TEXT to VARCHAR(255) for consistency with other entities
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private LoanStatus status = LoanStatus.ACTIVE;

    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<LoanInstallment> installments;

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UpdatedAt", nullable = false)
    private LocalDateTime updatedAt;
}
