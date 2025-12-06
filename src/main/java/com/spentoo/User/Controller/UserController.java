package com.spentoo.User.Controller;

import com.spentoo.User.dto.*;
import com.spentoo.User.Model.User;
import com.spentoo.User.Service.UserService;
import com.spentoo.User.Service.LoginHistoryService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final LoginHistoryService loginHistoryService;

    public UserController(UserService userService, LoginHistoryService loginHistoryService) {
        this.userService = userService;
        this.loginHistoryService = loginHistoryService;
    }

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

    @PostMapping("/Login")
    public LoginResponseDTO login(@RequestBody LoginDTO dto) {
        User user = userService.login(dto.email, dto.password);
        LoginResponseDTO response = new LoginResponseDTO();

        if (user == null) {
            response.message = "Invalid credentials";
            return response;
        }

        loginHistoryService.recordLogin(user, "127.0.0.1", "Chrome");

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
