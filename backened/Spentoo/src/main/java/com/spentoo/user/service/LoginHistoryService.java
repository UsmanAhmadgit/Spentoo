package com.spentoo.user.service;

import com.spentoo.user.model.LoginHistory;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.LoginHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class LoginHistoryService {

    private final LoginHistoryRepository loginHistoryRepository;

    public LoginHistoryService(LoginHistoryRepository loginHistoryRepository) {
        this.loginHistoryRepository = loginHistoryRepository;
    }

    @Transactional
    public void recordLogin(User user, String ipAddress, String deviceInfo) {
        LoginHistory loginHistory = new LoginHistory();
        loginHistory.setUser(user);
        loginHistory.setIpAddress(ipAddress);
        loginHistory.setDeviceInfo(deviceInfo);
        loginHistoryRepository.save(loginHistory);
    }

    @Transactional
    public void recordLogout(User user) {
        // This is a simplified approach. A more robust solution would involve tracking session IDs.
        // For now, we'll find the last login record for the user that doesn't have a logout time.
        loginHistoryRepository.findFirstByUserAndLogoutTimeIsNullOrderByLoginTimeDesc(user)
                .ifPresent(loginHistory -> {
                    loginHistory.setLogoutTime(LocalDateTime.now());
                    loginHistoryRepository.save(loginHistory);
                });
    }
}
