package com.example.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.Info;

public interface InfoRepository extends JpaRepository<Info, Long> {

    long countByTimeGreaterThanEqualAndTimeLessThan(LocalDateTime start, LocalDateTime end);

    List<Info> findByTimeGreaterThanEqualAndTimeLessThanOrderByTimeAsc(LocalDateTime start, LocalDateTime end);
}
