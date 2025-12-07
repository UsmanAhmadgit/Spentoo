package com.spentoo.expense.repository;

import com.spentoo.expense.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

    List<Expense> findByUser_UserID(Integer userID);

}
