package com.spentoo.expense.controller;

import com.spentoo.expense.dto.CreateExpenseRequestDTO;
import com.spentoo.expense.dto.ExpenseDTO;
import com.spentoo.expense.dto.UpdateExpenseRequestDTO;
import com.spentoo.expense.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ResponseEntity<ExpenseDTO> addExpense(
            @Valid @RequestBody CreateExpenseRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        ExpenseDTO createdExpense = expenseService.addExpense(requestDTO, userEmail);
        return new ResponseEntity<>(createdExpense, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDTO> editExpense(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateExpenseRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        ExpenseDTO updatedExpense = expenseService.editExpense(id, requestDTO, userEmail);
        return new ResponseEntity<>(updatedExpense, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        expenseService.deleteExpense(id, userEmail);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDTO> getSingleExpense(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        ExpenseDTO expense = expenseService.getSingleExpense(id, userEmail);
        return new ResponseEntity<>(expense, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<ExpenseDTO>> listExpenses(
            @AuthenticationPrincipal String userEmail) {
        List<ExpenseDTO> expenses = expenseService.listExpenses(userEmail);
        return new ResponseEntity<>(expenses, HttpStatus.OK);
    }
}
