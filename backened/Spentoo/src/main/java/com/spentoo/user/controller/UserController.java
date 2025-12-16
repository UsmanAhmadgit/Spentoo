package com.spentoo.user.controller;

import com.spentoo.user.dto.UserProfileDTO;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import com.spentoo.user.service.LoginHistoryService; // Corrected import
import com.spentoo.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final LoginHistoryService loginHistoryService;
    private final UserRepository userRepository;

    public UserController(UserService userService, LoginHistoryService loginHistoryService, UserRepository userRepository) {
        this.userService = userService;
        this.loginHistoryService = loginHistoryService;
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getUserProfile(@AuthenticationPrincipal String userEmail) {
        UserProfileDTO userProfile = userService.getUserProfile(userEmail);
        return ResponseEntity.ok(userProfile);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found during logout."));
        loginHistoryService.recordLogout(user);
        return ResponseEntity.ok("Logged out successfully.");
    }
}
