package com.example.backend.repository;

import com.example.backend.entity.DSystem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DSystemRepository extends JpaRepository<DSystem, Long> {
}