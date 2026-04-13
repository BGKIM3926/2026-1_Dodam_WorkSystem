package com.example.backend.repository;

import com.example.backend.entity.DSystem;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DSystemRepository extends JpaRepository<DSystem, Long> {

    List<DSystem> findByCustomerName(String customerName);

    List<DSystem> findByServiceNameMinAndCustomerName(
            String serviceNameMin,
            String customerName);

    Optional<DSystem> findFirstByCustomerNameAndServiceNameMinAndServiceIdIsNotNullOrderBySystemIdAsc(
            String customerName,
            String serviceNameMin);

    @Query("select coalesce(max(d.systemId), 0) from DSystem d")
    Long findMaxSystemId();

    @Query("select coalesce(max(d.serviceId), 0) from DSystem d")
    Long findMaxServiceId();

}
