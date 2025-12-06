package com.spentoo.User.Service;

import com.spentoo.User.Model.PasswordResetToken;
import com.spentoo.User.Model.User;
import com.spentoo.User.Repository.PasswordResetTokenRepository;
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
