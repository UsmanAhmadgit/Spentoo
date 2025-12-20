package com.spentoo.loan.repository;

import com.spentoo.loan.model.Loan;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Integer> {

    /**
     * Finds all loans for a specific user with eager loading of installments and payment methods.
     * @param user The user whose loans to find.
     * @return A list of loans for the given user.
     */
    @Query("SELECT DISTINCT l FROM Loan l " +
           "LEFT JOIN FETCH l.installments i " +
           "LEFT JOIN FETCH i.paymentMethod " +
           "WHERE l.user = :user")
    List<Loan> findAllByUser(@Param("user") User user);

    /**
     * Finds all loans for a user within a specific date range based on createdAt date (ignoring time).
     * @param user The user.
     * @param startDate The start date of the period (inclusive).
     * @param endDate The end date of the period (inclusive).
     * @return A list of loans matching the criteria.
     */
    @Query("SELECT DISTINCT l FROM Loan l " +
           "LEFT JOIN FETCH l.installments i " +
           "LEFT JOIN FETCH i.paymentMethod " +
           "WHERE l.user = :user " +
           "AND CAST(l.createdAt AS date) BETWEEN :startDate AND :endDate")
    List<Loan> findAllByUserAndCreatedAtDateBetween(@Param("user") User user,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate);

    /**
     * Finds all loans for a user within a specific date range based on startDate (the loan's start date).
     * @param user The user.
     * @param startDate The start date of the period (inclusive).
     * @param endDate The end date of the period (inclusive).
     * @return A list of loans matching the criteria.
     */
    @Query("SELECT DISTINCT l FROM Loan l " +
           "LEFT JOIN FETCH l.installments i " +
           "LEFT JOIN FETCH i.paymentMethod " +
           "WHERE l.user = :user " +
           "AND l.startDate BETWEEN :startDate AND :endDate")
    List<Loan> findAllByUserAndStartDateBetween(@Param("user") User user,
                                                @Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate);

    /**
     * Finds a single loan by ID for a specific user with eager loading of installments.
     * @param loanId The loan ID.
     * @param user The user.
     * @return The loan with installments loaded, or empty if not found.
     */
    @Query("SELECT DISTINCT l FROM Loan l " +
           "LEFT JOIN FETCH l.installments i " +
           "LEFT JOIN FETCH i.paymentMethod " +
           "WHERE l.loanId = :loanId AND l.user = :user")
    java.util.Optional<Loan> findByLoanIdAndUserWithInstallments(@Param("loanId") Integer loanId, @Param("user") User user);
}
