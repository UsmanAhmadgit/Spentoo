package com.spentoo.user.repository;

import com.spentoo.user.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {

    /**
     * Finds a token by its string value.
     * @param token The token string to find.
     * @return An Optional containing the found token, or empty if not found.
     */
    Optional<PasswordResetToken> findByToken(String token);
}
