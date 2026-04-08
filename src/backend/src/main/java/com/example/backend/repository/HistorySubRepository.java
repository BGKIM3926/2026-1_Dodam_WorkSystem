package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.HistorySub;

@Repository
public interface HistorySubRepository extends JpaRepository<HistorySub, Long> {
    List<HistorySub> findByHistoryIdOrderByCreatedAtAsc(Long historyId);
}
