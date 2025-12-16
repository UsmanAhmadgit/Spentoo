package com.spentoo.recurring.controller;

import com.spentoo.recurring.dto.CreateRecurringTransactionRequestDTO;
import com.spentoo.recurring.dto.RecurringTransactionDTO;
import com.spentoo.recurring.dto.UpdateRecurringTransactionRequestDTO;
import com.spentoo.recurring.service.RecurringTransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-transactions")
public class RecurringTransactionController {

    private final RecurringTransactionService recurringTransactionService;

    public RecurringTransactionController(RecurringTransactionService recurringTransactionService) {
        this.recurringTransactionService = recurringTransactionService;
    }

    @PostMapping
    public ResponseEntity<RecurringTransactionDTO> createRecurringTransaction(
            @Valid @RequestBody CreateRecurringTransactionRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        RecurringTransactionDTO newRecurring = recurringTransactionService.createRecurringTransaction(requestDTO, userEmail);
        return new ResponseEntity<>(newRecurring, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringTransactionDTO> updateRecurringTransaction(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateRecurringTransactionRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        RecurringTransactionDTO updatedRecurring = recurringTransactionService.updateRecurringTransaction(id, requestDTO, userEmail);
        return new ResponseEntity<>(updatedRecurring, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecurringTransaction(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        recurringTransactionService.deleteRecurringTransaction(id, userEmail);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecurringTransactionDTO> getRecurringTransaction(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        RecurringTransactionDTO recurring = recurringTransactionService.getRecurringTransaction(id, userEmail);
        return new ResponseEntity<>(recurring, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<RecurringTransactionDTO>> listRecurringTransactions(
            @AuthenticationPrincipal String userEmail) {
        List<RecurringTransactionDTO> recurrings = recurringTransactionService.listRecurringTransactions(userEmail);
        return new ResponseEntity<>(recurrings, HttpStatus.OK);
    }

    @PutMapping("/{id}/pause")
    public ResponseEntity<Void> pauseRecurringTransaction(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        recurringTransactionService.pauseRecurringTransaction(id, userEmail);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PutMapping("/{id}/resume")
    public ResponseEntity<Void> resumeRecurringTransaction(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        recurringTransactionService.resumeRecurringTransaction(id, userEmail);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping("/{id}/trigger-now")
    public ResponseEntity<Void> manuallyTriggerPayment(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        recurringTransactionService.manuallyTriggerPayment(id, userEmail);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
