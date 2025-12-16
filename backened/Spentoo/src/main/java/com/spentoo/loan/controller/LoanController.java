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
            @AuthenticationPrincipal String userEmail) {
        List<LoanDTO> loans = loanService.getAllLoans(userEmail, includeClosed);
        return new ResponseEntity<>(loans, HttpStatus.OK);
    }

    @GetMapping("/analytics")
    public ResponseEntity<LoanAnalyticsDTO> getLoanAnalytics(
            @AuthenticationPrincipal String userEmail) {
        LoanAnalyticsDTO analytics = loanService.getLoanAnalytics(userEmail);
        return new ResponseEntity<>(analytics, HttpStatus.OK);
    }
}
