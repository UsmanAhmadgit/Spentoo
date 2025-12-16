package com.spentoo.budget.controller;

import com.spentoo.budget.dto.BudgetDTO;
import com.spentoo.budget.dto.CreateBudgetRequestDTO;
import com.spentoo.budget.dto.UpdateBudgetRequestDTO;
import com.spentoo.budget.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping
    public ResponseEntity<BudgetDTO> createBudget(
            @Valid @RequestBody CreateBudgetRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        BudgetDTO newBudget = budgetService.createBudget(requestDTO, userEmail);
        return new ResponseEntity<>(newBudget, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetDTO> updateBudget(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateBudgetRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        BudgetDTO updatedBudget = budgetService.updateBudget(id, requestDTO, userEmail);
        return new ResponseEntity<>(updatedBudget, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        budgetService.deleteBudget(id, userEmail);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BudgetDTO> getSingleBudget(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        BudgetDTO budget = budgetService.getSingleBudget(id, userEmail);
        return new ResponseEntity<>(budget, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<BudgetDTO>> getAllBudgets(
            @AuthenticationPrincipal String userEmail) {
        List<BudgetDTO> budgets = budgetService.getAllBudgets(userEmail);
        return new ResponseEntity<>(budgets, HttpStatus.OK);
    }
}
