package com.example.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.Alert;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    Optional<Alert> findTopByBodyRawJsonContainingOrderByTimeDesc(String bodyRawJsonPart);
}
