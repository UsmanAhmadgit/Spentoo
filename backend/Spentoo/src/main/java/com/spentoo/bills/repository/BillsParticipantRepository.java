package com.spentoo.bills.repository;

import com.spentoo.bills.model.BillsParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BillsParticipantRepository extends JpaRepository<BillsParticipant, Integer> {
}
