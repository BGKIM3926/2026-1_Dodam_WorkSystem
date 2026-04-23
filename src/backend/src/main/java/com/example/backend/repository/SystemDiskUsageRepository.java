package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.SystemDiskUsage;

@Repository
public interface SystemDiskUsageRepository extends JpaRepository<SystemDiskUsage, Integer> {
}
