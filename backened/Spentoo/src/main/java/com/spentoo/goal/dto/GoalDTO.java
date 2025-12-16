package com.spentoo.goal.dto;

import com.spentoo.goal.model.GoalStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class GoalDTO {

    private Integer goalId;
    private Integer userId;
    private String name;
    private String description;
    private BigDecimal targetAmount;
    private LocalDate deadlineDate;
    private GoalStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Dynamically calculated fields
    private BigDecimal savedAmount;
    private BigDecimal progressPercentage;
}
