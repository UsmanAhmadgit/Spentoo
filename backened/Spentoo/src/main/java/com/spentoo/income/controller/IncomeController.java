package com.spentoo.income.controller;

import com.spentoo.income.dto.CreateIncomeRequestDTO;
import com.spentoo.income.dto.IncomeDTO;
import com.spentoo.income.dto.UpdateIncomeRequestDTO;
import com.spentoo.income.service.IncomeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/income")
public class IncomeController {

    private final IncomeService incomeService;

    public IncomeController(IncomeService incomeService) {
        this.incomeService = incomeService;
    }

    @PostMapping
    public ResponseEntity<IncomeDTO> addIncome(
            @Valid @RequestBody CreateIncomeRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        IncomeDTO createdIncome = incomeService.addIncome(requestDTO, userEmail);
        return new ResponseEntity<>(createdIncome, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncomeDTO> editIncome(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateIncomeRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        IncomeDTO updatedIncome = incomeService.editIncome(id, requestDTO, userEmail);
        return new ResponseEntity<>(updatedIncome, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncome(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        incomeService.deleteIncome(id, userEmail);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncomeDTO> getSingleIncome(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        IncomeDTO income = incomeService.getSingleIncome(id, userEmail);
        return new ResponseEntity<>(income, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<IncomeDTO>> listIncomes(
            @AuthenticationPrincipal String userEmail) {
        List<IncomeDTO> incomes = incomeService.listIncomes(userEmail);
        return new ResponseEntity<>(incomes, HttpStatus.OK);
    }
}
