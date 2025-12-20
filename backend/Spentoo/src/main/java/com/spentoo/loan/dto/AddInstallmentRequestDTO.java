package com.spentoo.loan.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AddInstallmentRequestDTO {

    @NotNull(message = "Amount paid is required.")
    @DecimalMin(value = "0.01", message = "Amount paid must be greater than 0.")
    private BigDecimal amountPaid;

    @NotNull(message = "Payment date is required.")
    private LocalDate paymentDate;

    private Integer paymentMethodId; // Optional, can be null for cash

    private String notes; // Optional
}
