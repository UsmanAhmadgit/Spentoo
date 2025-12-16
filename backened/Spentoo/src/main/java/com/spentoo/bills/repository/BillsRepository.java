package com.spentoo.bills.repository;

import com.spentoo.bills.model.Bills;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
