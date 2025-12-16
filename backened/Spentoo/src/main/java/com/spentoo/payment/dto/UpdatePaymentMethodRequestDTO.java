package com.spentoo.payment.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdatePaymentMethodRequestDTO {

    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-']+$", message = "Payment method name can only contain letters, numbers, spaces, hyphens, or apostrophes.")
    private String name;

    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-']+$", message = "Provider name can only contain letters, numbers, spaces, hyphens, or apostrophes.")
    private String provider;

    @Pattern(regexp = "^[a-zA-Z0-9X\\s\\-]+$", message = "Account number can only contain letters, numbers, 'X', spaces, or hyphens.")
    private String accountNumberMasked;

    private Boolean isActive; // Allows activating/deactivating a method
}
