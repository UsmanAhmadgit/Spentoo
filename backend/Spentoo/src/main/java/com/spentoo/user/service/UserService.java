package com.spentoo.user.service;

import com.spentoo.category.model.CategoryType;
import com.spentoo.category.service.CategoryService;
import com.spentoo.payment.service.PaymentMethodService;
import com.spentoo.user.dto.RegistrationRequestDTO;
import com.spentoo.user.dto.UserProfileDTO;
import com.spentoo.user.model.PasswordResetToken;
import com.spentoo.user.model.TokenType;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.PasswordResetTokenRepository;
import com.spentoo.user.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PaymentMethodService paymentMethodService;
    private final CategoryService categoryService;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordResetTokenRepository tokenRepository,
                       PaymentMethodService paymentMethodService, CategoryService categoryService,
                       EmailService emailService, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.paymentMethodService = paymentMethodService;
        this.categoryService = categoryService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User registerNewUser(RegistrationRequestDTO requestDTO) {
        if (!requestDTO.getPassword().equals(requestDTO.getConfirmPassword())) {
            throw new IllegalStateException("Passwords do not match.");
        }
        if (userRepository.findByEmailIgnoreCase(requestDTO.getEmail().trim()).isPresent()) {
            throw new IllegalStateException("An account with this email already exists.");
        }
        if (userRepository.findByUsername(requestDTO.getUsername().trim()).isPresent()) {
            throw new IllegalStateException("This username is already taken.");
        }

        User newUser = new User();
        newUser.setFirstName(requestDTO.getFirstName());
        newUser.setLastName(requestDTO.getLastName());
        newUser.setUsername(requestDTO.getUsername().trim());
        newUser.setEmail(requestDTO.getEmail().trim());
        newUser.setCountry(requestDTO.getCountry());
        newUser.setPasswordHash(passwordEncoder.encode(requestDTO.getPassword()));
        newUser.setActive(false); // User is inactive until email is verified

        User savedUser = userRepository.save(newUser);

        // Create default items
        createDefaultItemsForUser(savedUser);

        // Send verification email
        sendVerificationEmail(savedUser);

        return savedUser;
    }

    @Transactional
    public void verifyUser(String token) {
        PasswordResetToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalStateException("Invalid verification token."));

        if (verificationToken.isUsed() || verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Token is invalid or has expired.");
        }

        User user = verificationToken.getUser();
        user.setActive(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        tokenRepository.save(verificationToken);
    }

    @Transactional
    public void createPasswordResetTokenForUser(String userEmail) {
        if (userEmail == null) {
            throw new IllegalStateException("Email cannot be null.");
        }
        // --- DEBUG LOGGING ---
        System.out.println("Attempting to create password reset token for email: [" + userEmail.trim() + "]");

        User user = userRepository.findByEmailIgnoreCase(userEmail.trim())
                .orElseThrow(() -> new IllegalStateException("User with this email not found."));

        String token = UUID.randomUUID().toString();
        PasswordResetToken myToken = new PasswordResetToken();
        myToken.setUser(user);
        myToken.setToken(token);
        myToken.setTokenType(TokenType.PASSWORD_RESET);
        myToken.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(myToken);

        String resetLink = "http://your-frontend-url/reset-password?token=" + token; // Reverted to placeholder
        String emailContent = String.format(
            "<html>" +
            "<body style=\"font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;\">" +
            "  <div style=\"max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);\">" +
            "    <h2 style=\"color: #333; text-align: center;\">Password Reset for <span style=\"color:#7832DA;\">Spentoo</span></h2>" +
            "    <p style=\"font-size: 16px; color: #555;\">Hi <strong>%s</strong>,</p>" +
            "    <p style=\"font-size: 16px; color: #555;\">We received a request to reset your password. Please click the button below to set a new password:</p>" +
            "    <div style=\"text-align: center; margin: 30px 0;\">" +
            "      <a href=\"%s\" style=\"background-color:#7832DA; color:white; padding: 14px 24px; text-decoration:none; border-radius:6px; font-size:16px;\">" +
            "        Reset Password" +
            "      </a>" +
            "    </div>" +
            "    <p style=\"font-size: 14px; color: #777;\">If the button doesn't work, you can also click the link below:<br><br><a href=\"%s\" style=\"color: #7832DA;\">%s</a></p>" +
            "    <hr style=\"border: none; border-top: 1px solid #eee; margin: 30px 0;\"/>" +
            "    <p style=\"font-size: 12px; color: #999; text-align: center;\">If you didn’t request a password reset, you can safely ignore this email.</p>" +
            "    <p style=\"font-size: 12px; color: #999; text-align: center;\">© 2025 Spentoo. All rights reserved.</p>" +
            "  </div>" +
            "</body>" +
            "</html>",
            user.getFirstName(), resetLink, resetLink, resetLink
        );

        emailService.sendEmail(user.getEmail(), "Spentoo Password Reset Request", emailContent);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalStateException("Invalid password reset token."));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Token is invalid or has expired.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }

    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));
        return convertToUserProfileDTO(user);
    }

    @Transactional
    public void changePassword(String userEmail, String currentPassword, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalStateException("New password and confirm password do not match.");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalStateException("Current password is incorrect.");
        }

        // Check if new password is same as current password
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new IllegalStateException("New password must be different from current password.");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private void sendVerificationEmail(User user) {
        String token = UUID.randomUUID().toString();
        PasswordResetToken myToken = new PasswordResetToken();
        myToken.setUser(user);
        myToken.setToken(token);
        myToken.setTokenType(TokenType.EMAIL_VERIFICATION);
        myToken.setExpiresAt(LocalDateTime.now().plusHours(24));
        tokenRepository.save(myToken);

        String verificationLink = "http://your-frontend-url/verify-email?token=" + token; // Reverted to placeholder
        String emailContent = String.format(
            "<!DOCTYPE html>" +
            "<html>" +
            "<body style=\"font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;\">" +
            "  <div style=\"max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);\">" +
            "    <h2 style=\"color: #333; text-align: center;\">Welcome to <span style=\"color:#7832DA;\">Spentoo</span>!</h2>" +
            "    <p style=\"font-size: 16px; color: #555;\">Hi <strong>%s</strong>, 👋</p>" +
            "    <p style=\"font-size: 16px; color: #555;\">We're excited to have you on board! Before you can start using Spentoo, please verify your email address by clicking the button below.</p>" +
            "    <div style=\"text-align: center; margin: 30px 0;\">" +
            "      <a href=\"%s\" style=\"background-color:#7832DA; color:white; padding: 14px 24px; text-decoration:none; border-radius:6px; font-size:16px;\">" +
            "        Verify Email" +
            "      </a>" +
            "    </div>" +
            "    <p style=\"font-size: 14px; color: #777;\">If the button doesn't work, you can also click the link below:<br><br><a href=\"%s\" style=\"color: #7832DA;\">%s</a></p>" +
            "    <hr style=\"border: none; border-top: 1px solid #eee; margin: 30px 0;\"/>" +
            "    <p style=\"font-size: 12px; color: #999; text-align: center;\">If you didn’t request this account, you can ignore this email.</p>" +
            "    <p style=\"font-size: 12px; color: #999; text-align: center;\">© 2025 Spentoo. All rights reserved.</p>" +
            "  </div>" +
            "</body>" +
            "</html>",
            user.getFirstName(), verificationLink, verificationLink, verificationLink
        );

        emailService.sendEmail(user.getEmail(), "Verify Your Email for Spentoo", emailContent);
    }


    private void createDefaultItemsForUser(User user) {
        paymentMethodService.createDefaultCashMethod(user);
        paymentMethodService.createSystemGeneratedPaymentMethod(user, "RECURRING_AUTO_PAY");
        categoryService.createSystemGeneratedCategory(user, "Recurring Payments", CategoryType.EXPENSE, "🔄", "#FFC107");
        categoryService.createSystemGeneratedCategory(user, "Loan Payments", CategoryType.EXPENSE, "💸", "#F44336");
        categoryService.createSystemGeneratedCategory(user, "Loan Repayments", CategoryType.INCOME, "💰", "#4CAF50");
    }

    private UserProfileDTO convertToUserProfileDTO(User user) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setUserId(user.getUserId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setCountry(user.getCountry());
        dto.setActive(user.isActive());
        return dto;
    }
}
