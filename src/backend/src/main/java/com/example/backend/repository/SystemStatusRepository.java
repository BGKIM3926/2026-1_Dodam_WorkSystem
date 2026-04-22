package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.SystemStatus;

@Repository
public interface SystemStatusRepository extends JpaRepository<SystemStatus, Long> {
}
