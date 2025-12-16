package com.spentoo.bills.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BillDTO {

    private Integer billsId;
    private Integer userId; // Creator's UserID
    private BigDecimal totalAmount;
    private String description;
    private String status;
    private List<BillParticipantDTO> participants; // List of participants
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
