package com.spentoo.user.controller;

import com.spentoo.security.JwtUtil;
import com.spentoo.user.dto.*;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import com.spentoo.user.service.CustomUserDetailsService;
import com.spentoo.user.service.LoginHistoryService;
import com.spentoo.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final LoginHistoryService loginHistoryService;
    private final UserRepository userRepository;

    public AuthController(AuthenticationManager authenticationManager, CustomUserDetailsService userDetailsService,
                          UserService userService, JwtUtil jwtUtil, LoginHistoryService loginHistoryService,
                          UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.loginHistoryService = loginHistoryService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegistrationRequestDTO registrationRequest) {
        userService.registerNewUser(registrationRequest);
        return ResponseEntity.ok("Registration successful. Please check your email to verify your account.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@Valid @RequestBody LoginRequestDTO loginRequest, HttpServletRequest request) throws Exception {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getEmail());
        final String jwt = jwtUtil.generateToken(userDetails);

        // Record login history
        User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();
        String ipAddress = request.getRemoteAddr();
        String deviceInfo = request.getHeader("User-Agent");
        loginHistoryService.recordLogin(user, ipAddress, deviceInfo);

        return ResponseEntity.ok(new JwtResponseDTO(jwt));
    }

    @PostMapping("/verify-email") // Reverted to POST
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody EmailVerificationRequestDTO verificationRequest) { // Expecting token in body
        userService.verifyUser(verificationRequest.getToken());
        return ResponseEntity.ok("Email verified successfully. You can now log in.");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required.");
        }
        userService.createPasswordResetTokenForUser(email);
        return ResponseEntity.ok("Password reset link has been sent to your email.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody PasswordResetRequestDTO resetRequest) {
        if (!resetRequest.getNewPassword().equals(resetRequest.getConfirmPassword())) {
            return ResponseEntity.badRequest().body("Passwords do not match.");
        }
        userService.resetPassword(resetRequest.getToken(), resetRequest.getNewPassword());
        return ResponseEntity.ok("Password has been reset successfully.");
    }
}
