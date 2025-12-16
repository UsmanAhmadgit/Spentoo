package com.spentoo.loan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanAnalyticsDTO {
    private BigDecimal totalLoansTaken;
    private BigDecimal totalLoansGiven;
    private BigDecimal totalOutstanding;
    private BigDecimal totalReceivedForGivenLoans;
    private BigDecimal totalPaidForTakenLoans;
    private BigDecimal totalInterestSummary; // Placeholder for future interest calculations
}
