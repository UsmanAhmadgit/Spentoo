package com.spentoo.payment.repository;

import com.spentoo.payment.model.PaymentMethod;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Integer> {

    /**
     * Finds the "Cash" payment method for a specific user (case-insensitive).
     * @param user The user.
     * @param name The name of the payment method (e.g., "Cash").
     * @return An Optional containing the Cash payment method, or empty if not found.
     */
    Optional<PaymentMethod> findByUserAndNameIgnoreCase(User user, String name);

    /**
     * Finds a payment method by user and name (case-sensitive).
     * @param user The user.
     * @param name The name of the payment method.
     * @return An Optional containing the payment method, or empty if not found.
     */
    Optional<PaymentMethod> findByUserAndName(User user, String name);

    /**
     * Finds all payment methods for a specific user (active and inactive).
     * @param user The user.
     * @return A list of all payment methods for the user.
     */
    List<PaymentMethod> findAllByUser(User user);

    /**
     * Finds all active payment methods for a specific user.
     * @param user The user.
     * @return A list of active payment methods.
     */
    List<PaymentMethod> findAllByUserAndIsActiveTrue(User user);

    /**
     * Finds a payment method by user, name, and system-generated status.
     * Used to retrieve system-generated payment methods like "RECURRING_AUTO_PAY".
     * @param user The user who owns the payment method.
     * @param name The name of the payment method.
     * @param isSystemGenerated Whether the payment method is system-generated.
     * @return An Optional containing the found payment method, or empty if not found.
     */
    Optional<PaymentMethod> findByUserAndNameAndIsSystemGenerated(User user, String name, boolean isSystemGenerated);
}
