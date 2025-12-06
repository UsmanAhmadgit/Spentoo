package com.spentoo.user.repository;

import com.spentoo.user.model.LoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Integer> {
}
