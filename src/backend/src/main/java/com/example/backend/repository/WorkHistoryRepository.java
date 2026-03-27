package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.example.backend.entity.MaintenanceHistory;
import com.example.backend.dto.WorkHistoryResponseDto;

@Repository
public interface WorkHistoryRepository extends JpaRepository<MaintenanceHistory, Long> {

    List<MaintenanceHistory> findBySystemId(Long systemId);

    @Query("""
                SELECT new com.example.backend.dto.WorkHistoryResponseDto(
                    m.historyId,
                    m.workType,
                    m.issue,
                    m.equipment,
                    u.name,
                    m.region,
                    d.systemNameMin,
                    m.visitDate
                )
                FROM MaintenanceHistory m
                JOIN User u ON m.workerId = u.id
                JOIN DSystem d ON m.systemId = d.systemId
                WHERE d.serviceNameMin = :serviceName
            """)
    List<WorkHistoryResponseDto> findWithUserName(String serviceName);

    @Query("""
                SELECT new com.example.backend.dto.WorkHistoryResponseDto(
                    m.historyId,
                    m.workType,
                    m.issue,
                    m.equipment,
                    u.name,
                    m.region,
                    d.systemNameMin,
                    m.visitDate
                )
                FROM MaintenanceHistory m
                JOIN User u ON m.workerId = u.id
                JOIN DSystem d ON m.systemId = d.systemId
            """)
    List<WorkHistoryResponseDto> findAllWithUserName();

}
