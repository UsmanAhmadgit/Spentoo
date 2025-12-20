package com.spentoo.payment.model;

import com.spentoo.user.model.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "PaymentMethod")
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MethodID")
    private Integer methodId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @Column(name = "Name", nullable = false, length = 100)
    private String name;

    @Column(name = "Provider", length = 100)
    private String provider;

    @Column(name = "AccountNumberMasked", length = 50)
    private String accountNumberMasked;

    @Column(name = "IsActive", nullable = false)
    private boolean isActive = true; // Default to true as per specification

    @Column(name = "IsSystemGenerated", nullable = false)
    private boolean isSystemGenerated = false; // New field

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UpdatedAt", nullable = false)
    private LocalDateTime updatedAt;
}
