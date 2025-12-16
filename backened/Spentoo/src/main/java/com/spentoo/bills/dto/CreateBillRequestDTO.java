package com.spentoo.bills.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateBillRequestDTO {

    @NotNull(message = "Total amount is required.")
    @DecimalMin(value = "0.01", message = "Total amount must be greater than 0.")
    private BigDecimal totalAmount;

    private String description;

    // Category ID is only required if participants are provided (for creator's expense)
    private Integer categoryId;

    private Integer paymentMethodId; // Optional, defaults to Cash

    // Participants are optional - only validate if provided
    @Valid // Ensures validation is applied to each participant DTO in the list (if present)
    private List<BillParticipantDTO> participants;
}
