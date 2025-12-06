package com.spentoo.user.service;

import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(User user) {
        user.setPasswordHash(encoder.encode(user.getPasswordHash()));
        user.setIsActive(true);
        user.setCreatedAt(java.time.LocalDateTime.now());
        return userRepository.save(user);
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user == null) return null;

        if (!encoder.matches(password, user.getPasswordHash())) return null;

        return user;
    }
}
