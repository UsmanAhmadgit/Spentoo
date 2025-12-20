package com.spentoo.loan.controller;

import com.spentoo.loan.dto.AddInstallmentRequestDTO;
import com.spentoo.loan.dto.CreateLoanRequestDTO;
import com.spentoo.loan.dto.LoanAnalyticsDTO;
import com.spentoo.loan.dto.LoanDTO;
import com.spentoo.loan.dto.UpdateLoanRequestDTO;
import com.spentoo.loan.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @PostMapping
    public ResponseEntity<LoanDTO> createLoan(
            @Valid @RequestBody CreateLoanRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        LoanDTO newLoan = loanService.createLoan(requestDTO, userEmail);
        return new ResponseEntity<>(newLoan, HttpStatus.CREATED);
    }

    @PostMapping("/{loanId}/installments")
    public ResponseEntity<LoanDTO> addInstallment(
            @PathVariable("loanId") Integer loanId,
            @Valid @RequestBody AddInstallmentRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        LoanDTO updatedLoan = loanService.addInstallment(loanId, requestDTO, userEmail);
        return new ResponseEntity<>(updatedLoan, HttpStatus.OK);
    }

    @DeleteMapping("/{loanId}/installments/{installmentId}")
    public ResponseEntity<LoanDTO> deleteInstallment(
            @PathVariable("loanId") Integer loanId,
            @PathVariable("installmentId") Integer installmentId,
            @AuthenticationPrincipal String userEmail) {
        LoanDTO updatedLoan = loanService.deleteInstallment(loanId, installmentId, userEmail);
        return new ResponseEntity<>(updatedLoan, HttpStatus.OK);
    }

    @PutMapping("/{loanId}")
    public ResponseEntity<LoanDTO> updateLoan(
            @PathVariable("loanId") Integer loanId,
            @Valid @RequestBody UpdateLoanRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        LoanDTO updatedLoan = loanService.updateLoan(loanId, requestDTO, userEmail);
        return new ResponseEntity<>(updatedLoan, HttpStatus.OK);
    }

    @DeleteMapping("/{loanId}")
    public ResponseEntity<Void> deleteLoan(
            @PathVariable("loanId") Integer loanId,
            @AuthenticationPrincipal String userEmail) {
        loanService.deleteLoan(loanId, userEmail);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PutMapping("/{loanId}/close")
    public ResponseEntity<LoanDTO> closeLoanManually(
            @PathVariable("loanId") Integer loanId,
            @AuthenticationPrincipal String userEmail) {
        LoanDTO closedLoan = loanService.closeLoanManually(loanId, userEmail);
        return new ResponseEntity<>(closedLoan, HttpStatus.OK);
    }

    @GetMapping("/{loanId}")
    public ResponseEntity<LoanDTO> getSingleLoan(
            @PathVariable("loanId") Integer loanId,
            @AuthenticationPrincipal String userEmail) {
        LoanDTO loan = loanService.getSingleLoan(loanId, userEmail);
        return new ResponseEntity<>(loan, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<LoanDTO>> getAllLoans(
            @RequestParam(name = "includeClosed", defaultValue = "false") boolean includeClosed,
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @AuthenticationPrincipal String userEmail) {
        List<LoanDTO> loans;
        
        // Log incoming parameters for debugging
        System.out.println("=== LOAN CONTROLLER - getAllLoans ===");
        System.out.println("Filter: " + filter);
        System.out.println("StartDate: " + startDate);
        System.out.println("EndDate: " + endDate);
        System.out.println("IncludeClosed: " + includeClosed);
        
        // If custom date range is provided, use it (takes priority over filter)
        // Also check that the values are not the string "null"
        if (startDate != null && 
            !startDate.trim().isEmpty() && 
            !startDate.trim().equalsIgnoreCase("null") &&
            endDate != null && 
            !endDate.trim().isEmpty() &&
            !endDate.trim().equalsIgnoreCase("null")) {
            try {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate.trim());
                java.time.LocalDate end = java.time.LocalDate.parse(endDate.trim());
                loans = loanService.getAllLoansByDateRange(userEmail, includeClosed, start, end);
            } catch (java.time.format.DateTimeParseException e) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            } catch (IllegalStateException e) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            } catch (Exception e) {
                return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } else if (filter != null && !filter.trim().isEmpty() && !filter.trim().equalsIgnoreCase("null")) {
            String filterLower = filter.toLowerCase().trim();
            System.out.println("Using filter: " + filterLower);
            switch (filterLower) {
                case "lastweek":
                    loans = loanService.getAllLoansLastWeek(userEmail, includeClosed);
                    System.out.println("Returning loans for last week. Count: " + (loans != null ? loans.size() : 0));
                    break;
                case "lastmonth":
                    loans = loanService.getAllLoansLastMonth(userEmail, includeClosed);
                    System.out.println("Returning loans for last month. Count: " + (loans != null ? loans.size() : 0));
                    break;
                case "lastyear":
                    loans = loanService.getAllLoansLastYear(userEmail, includeClosed);
                    System.out.println("Returning loans for last year. Count: " + (loans != null ? loans.size() : 0));
                    break;
                default:
                    // Unknown filter value, return all loans
                    System.out.println("Unknown filter value: " + filterLower + ", returning all loans");
                    loans = loanService.getAllLoans(userEmail, includeClosed);
                    break;
            }
        } else {
            // No filter or date range specified, return all loans
            System.out.println("No filter or date range specified, returning all loans");
            loans = loanService.getAllLoans(userEmail, includeClosed);
        }
        
        System.out.println("Total loans returned: " + (loans != null ? loans.size() : 0));
        return new ResponseEntity<>(loans, HttpStatus.OK);
    }

    @GetMapping("/analytics")
    public ResponseEntity<LoanAnalyticsDTO> getLoanAnalytics(
            @AuthenticationPrincipal String userEmail) {
        LoanAnalyticsDTO analytics = loanService.getLoanAnalytics(userEmail);
        return new ResponseEntity<>(analytics, HttpStatus.OK);
    }
}
