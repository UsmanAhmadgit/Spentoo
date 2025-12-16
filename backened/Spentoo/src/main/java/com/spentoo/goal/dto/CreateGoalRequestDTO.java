package com.spentoo.goal.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateGoalRequestDTO {

    @NotBlank(message = "Goal name is required.")
    private String name;

    private String description;

    @NotNull(message = "Target amount is required.")
    @DecimalMin(value = "0.01", message = "Target amount must be greater than 0.")
    private BigDecimal targetAmount;

    @NotNull(message = "Deadline date is required.")
    @FutureOrPresent(message = "Deadline date cannot be in the past.")
    private LocalDate deadlineDate;
}
