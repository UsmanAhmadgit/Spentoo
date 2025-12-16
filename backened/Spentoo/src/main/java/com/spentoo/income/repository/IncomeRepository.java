package com.spentoo.income.repository;

import com.spentoo.income.model.Income;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface IncomeRepository extends JpaRepository<Income, Integer> {

    /**
     * Finds all income records for a specific user with eager fetching of category.
     * This prevents N+1 query problems.
     * @param user The user whose income records to find.
     * @return A list of income records for the given user.
     */
    @Query("SELECT i FROM Income i " +
           "LEFT JOIN FETCH i.category " +
           "WHERE i.user = :user " +
           "ORDER BY i.transactionDate DESC")
    List<Income> findAllByUser(@Param("user") User user);

    /**
     * Finds an income record by ID and user with eager fetching.
     * @param incomeId The income ID.
     * @param user The user.
     * @return An Optional containing the income if found and owned by user.
     */
    @Query("SELECT i FROM Income i " +
           "LEFT JOIN FETCH i.category " +
           "WHERE i.incomeId = :incomeId AND i.user = :user")
    Optional<Income> findByIdAndUser(@Param("incomeId") Integer incomeId, @Param("user") User user);

}
