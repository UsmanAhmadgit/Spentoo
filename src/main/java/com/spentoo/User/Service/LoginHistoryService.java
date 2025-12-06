package com.spentoo.User.Service;

import com.spentoo.User.Model.LoginHistory;
import com.spentoo.User.Model.User;
import com.spentoo.User.Repository.LoginHistoryRepository;
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
