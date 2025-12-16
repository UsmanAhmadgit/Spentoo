package com.spentoo.loan.dto;

import com.spentoo.loan.model.LoanStatus; // Corrected import
import com.spentoo.loan.model.LoanType;   // Corrected import
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private List<LoanInstallmentDTO> installments; // List of associated installments
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
