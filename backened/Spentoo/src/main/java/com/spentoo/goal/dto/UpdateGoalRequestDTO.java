package com.spentoo.goal.dto;

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

    @FutureOrPresent(message = "Deadline date cannot be in the past.")
    private LocalDate deadlineDate;
}
