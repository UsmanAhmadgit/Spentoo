package com.spentoo.user.service;

import com.spentoo.user.model.LoginHistory;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.LoginHistoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class LoginHistoryService {

    private final LoginHistoryRepository repo;

    public LoginHistoryService(LoginHistoryRepository repo) {
        this.repo = repo;
    }

    public void recordLogin(User user, String ip, String device) {
        LoginHistory history = new LoginHistory();
        history.setUser(user);
        history.setLoginTime(LocalDateTime.now());
        history.setIpAddress(ip);
        history.setDeviceInfo(device);

        repo.save(history);
    }
}
