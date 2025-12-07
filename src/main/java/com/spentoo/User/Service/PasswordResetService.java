package com.spentoo.user.service;

import com.spentoo.user.model.PasswordResetToken;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.PasswordResetTokenRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final PasswordResetTokenRepository repo;

    public PasswordResetService(PasswordResetTokenRepository repo) {
        this.repo = repo;
    }

    public PasswordResetToken generateToken(User user) {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setTokenType("RESET");
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        token.setIsUsed(false);
        token.setCreatedAt(LocalDateTime.now());

        return repo.save(token);
    }
}
