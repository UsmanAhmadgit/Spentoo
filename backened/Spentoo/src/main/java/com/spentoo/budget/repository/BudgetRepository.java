package com.spentoo.budget.repository;

import com.spentoo.budget.model.Budget;
import com.spentoo.category.model.Category;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Integer> {

    /**
     * Finds all budgets for a specific user with eager fetching of category and user.
     * This prevents N+1 query problems.
     * @param user The user whose budgets to find.
     * @return A list of budgets for the given user.
     */
    @Query("SELECT b FROM Budget b " +
           "LEFT JOIN FETCH b.category c " +
           "LEFT JOIN FETCH c.parentCategory " +
           "LEFT JOIN FETCH b.user " +
           "WHERE b.user = :user " +
           "ORDER BY b.startDate DESC, b.endDate DESC")
    List<Budget> findAllByUser(@Param("user") User user);

    /**
     * Finds a budget by ID and user with eager fetching.
     * @param budgetId The budget ID.
     * @param user The user.
     * @return An Optional containing the budget if found and owned by user.
     */
    @Query("SELECT b FROM Budget b " +
           "LEFT JOIN FETCH b.category c " +
           "LEFT JOIN FETCH c.parentCategory " +
           "LEFT JOIN FETCH b.user " +
           "WHERE b.budgetId = :budgetId AND b.user = :user")
    Optional<Budget> findByIdAndUser(@Param("budgetId") Integer budgetId, @Param("user") User user);

    /**
     * Finds all budgets for a specific user and category that are active within a given date range.
     * This is used to find which budgets are affected by an expense change.
     * @param user The user.
     * @param category The category.
     * @param expenseDate The date of the expense.
     * @return A list of budgets affected by the expense change.
     */
    @Query("SELECT b FROM Budget b " +
           "LEFT JOIN FETCH b.category c " +
           "LEFT JOIN FETCH c.parentCategory " +
           "LEFT JOIN FETCH b.user " +
           "WHERE b.user = :user " +
           "AND b.category = :category " +
           "AND b.startDate <= :expenseDate " +
           "AND b.endDate >= :expenseDate")
    List<Budget> findAllByUserAndCategoryAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            @Param("user") User user,
            @Param("category") Category category,
            @Param("expenseDate") LocalDate expenseDate);

}
