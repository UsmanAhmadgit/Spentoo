package com.spentoo.goal.model;

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
@Table(name = "Goal")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "GoalID")
    private Integer goalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @Column(name = "Name", nullable = false, length = 100)
    private String name;

    @Column(name = "TargetAmount", nullable = false, precision = 10, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "SavedAmount", nullable = false, precision = 10, scale = 2)
    private BigDecimal savedAmount = BigDecimal.ZERO;

    @Column(name = "ProgressPercent", precision = 5, scale = 2)
    private BigDecimal progressPercent;

    @Column(name = "Deadline", nullable = false, insertable = true, updatable = true)
    private LocalDate deadlineDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = true, length = 20)
    private GoalStatus status = GoalStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UpdatedAt", nullable = false)
    private LocalDateTime updatedAt;
}
