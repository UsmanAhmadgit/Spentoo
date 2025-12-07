package com.spentoo.expense.controller;

import com.spentoo.expense.dto.ExpenseDTO;
import com.spentoo.expense.model.Expense;
import com.spentoo.expense.service.ExpenseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expense")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping("/add")
    public Expense addExpense(@RequestBody ExpenseDTO dto) {
        return expenseService.addExpense(dto);
    }

    @GetMapping("/user/{userID}")
    public List<Expense> getExpenses(@PathVariable Integer userID) {
        return expenseService.getUserExpenses(userID);
    }

    @PutMapping("/update/{expenseID}")
    public Expense updateExpense(@PathVariable Integer expenseID, @RequestBody ExpenseDTO dto) {
        return expenseService.updateExpense(expenseID, dto);
    }

    @DeleteMapping("/delete/{expenseID}")
    public String deleteExpense(@PathVariable Integer expenseID) {
        expenseService.deleteExpense(expenseID);
        return "Expense deleted";
    }
}
