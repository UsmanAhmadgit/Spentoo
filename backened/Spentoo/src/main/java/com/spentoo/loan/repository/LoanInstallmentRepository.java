package com.spentoo.loan.repository;

import com.spentoo.loan.model.LoanInstallment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoanInstallmentRepository extends JpaRepository<LoanInstallment, Integer> {
}
