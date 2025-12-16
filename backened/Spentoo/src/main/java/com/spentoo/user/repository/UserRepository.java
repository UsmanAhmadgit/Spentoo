package com.spentoo.user.repository;

import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    /**
     * Finds a user by their email address (case-sensitive).
     * @param email The email address to search for.
     * @return An Optional containing the found user, or empty if not found.
     */
    Optional<User> findByEmail(String email);

    /**
     * Finds a user by their email address, ignoring case.
     * @param email The email address to search for.
     * @return An Optional containing the found user, or empty if not found.
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Finds a user by their username.
     * @param username The username to search for.
     * @return An Optional containing the found user, or empty if not found.
     */
    Optional<User> findByUsername(String username);
}
