package com.spentoo.expense.service;

import com.spentoo.expense.dto.ExpenseDTO;
import com.spentoo.expense.model.Expense;
import com.spentoo.expense.repository.ExpenseRepository;
import com.spentoo.user.repository.UserRepository;
import com.spentoo.category.repository.CategoryRepository;
import com.spentoo.payment.repository.PaymentMethodRepository;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepo;
    private final UserRepository userRepo;
    private final CategoryRepository categoryRepo;
    private final PaymentMethodRepository paymentRepo;

    public ExpenseService(
            ExpenseRepository expenseRepo,
            UserRepository userRepo,
            CategoryRepository categoryRepo,
            PaymentMethodRepository paymentRepo
    ) {
        this.expenseRepo = expenseRepo;
        this.userRepo = userRepo;
        this.categoryRepo = categoryRepo;
        this.paymentRepo = paymentRepo;
    }

    public Expense addExpense(ExpenseDTO dto) {

        Expense expense = new Expense();

        expense.setUser(userRepo.findById(dto.userID).orElse(null));
        expense.setCategory(categoryRepo.findById(dto.categoryID).orElse(null));

        if (dto.paymentMethodID != null) {
            expense.setPaymentMethod(paymentRepo.findById(dto.paymentMethodID).orElse(null));
        }

        expense.setAmount(dto.amount);
        expense.setCurrency(dto.currency);
        expense.setDescription(dto.description);
        expense.setMerchant(dto.merchant);
        expense.setTags(dto.tags);

        expense.setCreatedAt(LocalDateTime.now());
        expense.setUpdatedAt(LocalDateTime.now());

        return expenseRepo.save(expense);
    }

    public List<Expense> getUserExpenses(Integer userID) {
        return expenseRepo.findByUser_UserID(userID);
    }

    public Expense updateExpense(Integer expenseID, ExpenseDTO dto) {

        Expense expense = expenseRepo.findById(expenseID).orElse(null);
        if (expense == null) return null;

        expense.setAmount(dto.amount);
        expense.setCurrency(dto.currency);
        expense.setDescription(dto.description);
        expense.setMerchant(dto.merchant);
        expense.setTags(dto.tags);
        expense.setUpdatedAt(LocalDateTime.now());

        return expenseRepo.save(expense);
    }

    public void deleteExpense(Integer expenseID) {
        expenseRepo.deleteById(expenseID);
    }
}
