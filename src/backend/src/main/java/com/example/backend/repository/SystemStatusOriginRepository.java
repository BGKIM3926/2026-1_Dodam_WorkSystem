package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.SystemStatusOrigin;

@Repository
public interface SystemStatusOriginRepository extends JpaRepository<SystemStatusOrigin, Integer> {
}
