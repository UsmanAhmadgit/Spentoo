package com.spentoo.user.controller;

import com.spentoo.user.dto.*;
import com.spentoo.user.model.User;
import com.spentoo.user.service.UserService;
import com.spentoo.user.service.LoginHistoryService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000") // allow React frontend
public class UserController {

    private final UserService userService;
    private final LoginHistoryService loginHistoryService;

    public UserController(UserService userService, LoginHistoryService loginHistoryService) {
        this.userService = userService;
        this.loginHistoryService = loginHistoryService;
    }

    // Registration endpoint
    @PostMapping("/register")
    public String register(@RequestBody RegisterDTO dto) {
        User user = new User();
        user.setName(dto.name);
        user.setEmail(dto.email);
        user.setPasswordHash(dto.password);
        user.setPhone(dto.phone);
        userService.register(user);
        return "User registered successfully";
    }

    // Login endpoint (lowercase 'login')
    @PostMapping("/login")
    public LoginResponseDTO login(@RequestBody LoginDTO dto) {
        User user = userService.login(dto.email, dto.password);
        LoginResponseDTO response = new LoginResponseDTO();

        if (user == null) {
            response.message = "Invalid credentials";
            return response;
        }

        // Record login history
        loginHistoryService.recordLogin(user, "127.0.0.1", "Chrome");

        // Prepare user DTO
        UserDTO userDTO = new UserDTO();
        userDTO.userID = user.getUserID();
        userDTO.name = user.getName();
        userDTO.email = user.getEmail();

        response.user = userDTO;
        response.message = "Login successful";
        response.token = "JWT-WILL-BE-ADDED-HERE";

        return response;
    }
}
