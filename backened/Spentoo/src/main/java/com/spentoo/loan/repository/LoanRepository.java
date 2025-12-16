package com.spentoo.loan.repository;

import com.spentoo.loan.model.Loan;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Integer> {

    /**
     * Finds all loans for a specific user.
     * @param user The user whose loans to find.
     * @return A list of loans for the given user.
     */
    List<Loan> findAllByUser(User user);
}
