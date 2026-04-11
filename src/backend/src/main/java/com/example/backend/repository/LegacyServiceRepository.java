package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.LegacyService;

@Repository
public interface LegacyServiceRepository extends JpaRepository<LegacyService, Long> {
    List<LegacyService> findByServiceIdIn(List<Long> serviceIds);
}

