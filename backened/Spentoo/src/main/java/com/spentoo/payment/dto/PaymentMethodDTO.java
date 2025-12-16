package com.spentoo.payment.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PaymentMethodDTO {

    private Integer methodId;
    private Integer userId;
    private String name;
    private String provider;
    private String accountNumberMasked;
    private boolean isActive;
    private boolean isSystemGenerated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
