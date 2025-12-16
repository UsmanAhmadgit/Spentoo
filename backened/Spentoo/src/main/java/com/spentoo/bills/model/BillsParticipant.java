package com.spentoo.bills.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "BillsParticipants")
public class BillsParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ParticipantID")
    private Integer participantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BillID", nullable = false)
    private Bills bill;

    @Column(name = "ParticipantName", nullable = false, length = 100)
    private String participantName;

    @Column(name = "ShareAmount", nullable = false, precision = 18, scale = 2)
    private BigDecimal shareAmount;

    @Column(name = "IsCreator", nullable = false)
    private boolean isCreator = false; // Default to false

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
