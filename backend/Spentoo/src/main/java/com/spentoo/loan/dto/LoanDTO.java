package com.spentoo.loan.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.spentoo.loan.model.LoanStatus; // Corrected import
import com.spentoo.loan.model.LoanType;   // Corrected import
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class LoanDTO {

    private Integer loanId;
    private Integer userId;
    private LoanType type;
    private String personName;
    private BigDecimal originalAmount;
    private BigDecimal remainingAmount;
    private BigDecimal interestRate;
    private LocalDate startDate;
    private LocalDate dueDate;
    private String notes;
    private LoanStatus status;
    
    @JsonInclude(JsonInclude.Include.ALWAYS) // Always include installments, even if empty
    private List<LoanInstallmentDTO> installments = new ArrayList<>(); // List of associated installments, initialized to empty list
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
