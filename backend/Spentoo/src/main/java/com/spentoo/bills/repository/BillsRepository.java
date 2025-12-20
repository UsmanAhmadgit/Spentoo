package com.spentoo.bills.repository;

import com.spentoo.bills.model.Bills;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillsRepository extends JpaRepository<Bills, Integer> {

    /**
     * Finds all bills created by a specific user with eager fetching of participants and user.
     * This prevents N+1 query problems.
     * @param user The user whose bills to find.
     * @return A list of bills for the given user.
     */
    @Query("SELECT b FROM Bills b " +
           "LEFT JOIN FETCH b.participants " +
           "LEFT JOIN FETCH b.user " +
           "WHERE b.user = :user " +
           "ORDER BY b.createdAt DESC")
    List<Bills> findAllByUser(@Param("user") User user);

    /**
     * Finds a bill by ID and user with eager fetching.
     * @param billsId The bill ID.
     * @param user The user.
     * @return An Optional containing the bill if found and owned by user.
     */
    @Query("SELECT b FROM Bills b " +
           "LEFT JOIN FETCH b.participants " +
           "LEFT JOIN FETCH b.user " +
           "WHERE b.billsId = :billsId AND b.user = :user")
    Optional<Bills> findByIdAndUser(@Param("billsId") Integer billsId, @Param("user") User user);

    /**
     * Finds all bills for a user within a specific date range based on createdAt date (ignoring time).
     * @param user The user.
     * @param startDate The start date of the period (inclusive).
     * @param endDate The end date of the period (inclusive).
     * @return A list of bills matching the criteria.
     */
    @Query("SELECT b FROM Bills b " +
           "LEFT JOIN FETCH b.participants " +
           "LEFT JOIN FETCH b.user " +
           "WHERE b.user = :user " +
           "AND CAST(b.createdAt AS date) BETWEEN :startDate AND :endDate " +
           "ORDER BY b.createdAt DESC")
    List<Bills> findAllByUserAndCreatedAtDateBetween(@Param("user") User user,
                                                       @Param("startDate") LocalDate startDate,
                                                       @Param("endDate") LocalDate endDate);
}
