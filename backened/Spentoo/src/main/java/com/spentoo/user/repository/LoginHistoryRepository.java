package com.spentoo.user.repository;

import com.spentoo.user.model.LoginHistory;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Integer> {

    /**
     * Finds the most recent login record for a user that has not been logged out yet.
     * @param user The user.
     * @return An Optional containing the found login history, or empty if not found.
     */
    Optional<LoginHistory> findFirstByUserAndLogoutTimeIsNullOrderByLoginTimeDesc(User user);
}
