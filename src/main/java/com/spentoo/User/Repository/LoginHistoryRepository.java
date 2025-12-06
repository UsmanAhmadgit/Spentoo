package com.spentoo.User.Repository;

import com.spentoo.User.Model.LoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Integer> {
}
