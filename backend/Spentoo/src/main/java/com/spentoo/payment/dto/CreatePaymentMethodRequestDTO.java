package com.spentoo.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreatePaymentMethodRequestDTO {

    @NotBlank(message = "Payment method name cannot be empty.")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-']+$", message = "Payment method name can only contain letters, numbers, spaces, hyphens, or apostrophes.")
    private String name;

    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-']+$", message = "Provider name can only contain letters, numbers, spaces, hyphens, or apostrophes.")
    private String provider;

    @Pattern(regexp = "^[a-zA-Z0-9X\\s\\-]+$", message = "Account number can only contain letters, numbers, 'X', spaces, or hyphens.")
    private String accountNumberMasked;
}
