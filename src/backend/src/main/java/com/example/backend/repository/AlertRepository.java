package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.Alert;

public interface AlertRepository extends JpaRepository<Alert, Long> {
}
