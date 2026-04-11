package com.example.backend.repository;

import com.example.backend.entity.DSystem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DSystemRepository extends JpaRepository<DSystem, Long> {

    List<DSystem> findByCustomerName(String customerName);

    List<DSystem> findByServiceNameMinAndCustomerName(
            String serviceNameMin,
            String customerName);

}
