package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.ServiceManager;

@Repository
public interface ServiceManagerRepository extends JpaRepository<ServiceManager, Long> {

    List<ServiceManager> findByServiceId(Long serviceId);
}
