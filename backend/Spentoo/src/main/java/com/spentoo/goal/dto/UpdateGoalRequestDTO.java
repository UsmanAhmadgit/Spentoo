package com.spentoo.goal.dto;

import com.spentoo.goal.model.GoalStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateGoalRequestDTO {

    private String name;

    private String description;

    @DecimalMin(value = "0.01", message = "Target amount must be greater than 0.")
    private BigDecimal targetAmount;

    @DecimalMin(value = "0", message = "Saved amount must be 0 or greater.")
    private BigDecimal savedAmount;

    @FutureOrPresent(message = "Deadline date cannot be in the past.")
    private LocalDate deadlineDate;

    private GoalStatus status;
}
