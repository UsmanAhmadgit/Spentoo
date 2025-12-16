package com.spentoo.bills.model;

import com.spentoo.user.model.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Entity
@Table(name = "Bills")
public class Bills {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BillsID")
    private Integer billsId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @Column(name = "TotalAmount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "Description", length = 255)
    private String description;

    @Column(name = "Status", nullable = false, length = 30)
    private String status = "Unpaid"; // Default to "Unpaid" as per specification

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BillsParticipant> participants;
    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UpdatedAt", nullable = false)
    private LocalDateTime updatedAt;
}
