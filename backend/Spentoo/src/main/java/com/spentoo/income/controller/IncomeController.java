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
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @AuthenticationPrincipal String userEmail) {
        List<IncomeDTO> incomes;
        
        // If custom date range is provided, use it (takes priority over filter)
        if (startDate != null && !startDate.trim().isEmpty() && endDate != null && !endDate.trim().isEmpty()) {
            try {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate.trim());
                java.time.LocalDate end = java.time.LocalDate.parse(endDate.trim());
                incomes = incomeService.listIncomesByDateRange(userEmail, start, end);
            } catch (java.time.format.DateTimeParseException e) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            } catch (IllegalStateException e) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            } catch (Exception e) {
                return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } else if (filter != null) {
            switch (filter.toLowerCase()) {
                case "lastweek":
                    incomes = incomeService.listIncomesLastWeek(userEmail);
                    break;
                case "lastmonth":
                    incomes = incomeService.listIncomesLastMonth(userEmail);
                    break;
                case "lastyear":
                    incomes = incomeService.listIncomesLastYear(userEmail);
                    break;
                default:
                    incomes = incomeService.listIncomes(userEmail);
                    break;
            }
        } else {
            incomes = incomeService.listIncomes(userEmail);
        }
        
        return new ResponseEntity<>(incomes, HttpStatus.OK);
    }
}
