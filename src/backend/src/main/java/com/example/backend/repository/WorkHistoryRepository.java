package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.backend.dto.WorkHistoryResponseDto;
import com.example.backend.entity.MaintenanceHistory;

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
                    d.serviceNameMin,
                    d.systemNameMin,
                    m.visitDate
                )
                FROM MaintenanceHistory m
                JOIN User u ON m.workerId = u.id
                JOIN DSystem d ON m.systemId = d.systemId
                WHERE d.serviceNameMin = :serviceName
                ORDER BY m.visitDate DESC, m.historyId DESC
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
                    d.serviceNameMin,
                    d.systemNameMin,
                    m.visitDate
                )
                FROM MaintenanceHistory m
                JOIN User u ON m.workerId = u.id
                JOIN DSystem d ON m.systemId = d.systemId
                ORDER BY m.visitDate DESC, m.historyId DESC
            """)
    List<WorkHistoryResponseDto> findAllWithUserName();

}
