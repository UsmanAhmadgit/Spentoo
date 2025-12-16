package com.spentoo.recurring.repository;

import com.spentoo.recurring.model.RecurringTransaction;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Integer> {

    /**
     * Finds all recurring transactions for a specific user.
     * @param user The user whose recurring transactions to find.
     * @return A list of recurring transactions for the given user.
     */
    List<RecurringTransaction> findAllByUser(User user);

    /**
     * Finds all recurring transactions that are due to run on a specific date.
     * @param nextRunDate The date on which transactions are due.
     * @return A list of recurring transactions due on the given date.
     */
    List<RecurringTransaction> findAllByNextRunDate(LocalDate nextRunDate);
}
