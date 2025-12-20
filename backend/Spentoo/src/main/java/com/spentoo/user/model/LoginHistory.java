package com.spentoo.user.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "LoginHistory")
public class LoginHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LoginID")
    private Integer loginId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(name = "LoginTime", nullable = false, updatable = false)
    private LocalDateTime loginTime;

    @Column(name = "LogoutTime")
    private LocalDateTime logoutTime;

    @Column(name = "IPAddress", length = 50)
    private String ipAddress;

    @Column(name = "DeviceInfo", length = 150)
    private String deviceInfo;
}
