package com.spentoo.expense.repository;

import com.spentoo.category.model.Category;
import com.spentoo.expense.model.Expense;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

    /**
     * Finds all expenses for a specific user with eager fetching of category and payment method.
     * This prevents N+1 query problems.
     * @param user The user whose expenses to find.
     * @return A list of expenses for the given user.
     */
    @Query("SELECT e FROM Expense e " +
           "LEFT JOIN FETCH e.category " +
           "LEFT JOIN FETCH e.paymentMethod " +
           "WHERE e.user = :user " +
           "ORDER BY e.transactionDate DESC")
    List<Expense> findAllByUser(@Param("user") User user);

    /**
     * Finds an expense by ID and user with eager fetching.
     * @param expenseId The expense ID.
     * @param user The user.
     * @return An Optional containing the expense if found and owned by user.
     */
    @Query("SELECT e FROM Expense e " +
           "LEFT JOIN FETCH e.category " +
           "LEFT JOIN FETCH e.paymentMethod " +
           "WHERE e.expenseId = :expenseId AND e.user = :user")
    Optional<Expense> findByIdAndUser(@Param("expenseId") Integer expenseId, @Param("user") User user);

    /**
     * Finds an expense by user and a description containing a specific string.
     * This is used to link a Bill's creator share to its corresponding Expense.
     * @param user The user who owns the expense.
     * @param descriptionPart A string that the expense description should contain.
     * @return An Optional containing the found Expense, or empty if not found.
     */
    Optional<Expense> findByUserAndDescriptionContaining(User user, String descriptionPart);

    /**
     * Finds all expenses for a user, within a specific category, and between two dates.
     * This is used to calculate the total spent amount for a budget.
     * @param user The user.
     * @param category The category.
     * @param startDate The start date of the period.
     * @param endDate The end date of the period.
     * @return A list of expenses matching the criteria.
     */
    List<Expense> findAllByUserAndCategoryAndTransactionDateBetween(User user, Category category, LocalDate startDate, LocalDate endDate);

    /**
     * Finds all expenses for a user within a specific date range.
     * @param user The user.
     * @param startDate The start date of the period.
     * @param endDate The end date of the period.
     * @return A list of expenses matching the criteria.
     */
    List<Expense> findAllByUserAndTransactionDateBetween(User user, LocalDate startDate, LocalDate endDate);
}
