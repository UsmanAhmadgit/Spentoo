package com.spentoo.test.controller;

import com.spentoo.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final UserRepository userRepository;

    public TestController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/check-email")
    public ResponseEntity<String> checkEmail(@RequestParam String email) {
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email parameter is required.");
        }
        boolean exists = userRepository.findByEmailIgnoreCase(email.trim()).isPresent();
        return ResponseEntity.ok(exists ? "Email found in DB." : "Email NOT found in DB.");
    }
}
