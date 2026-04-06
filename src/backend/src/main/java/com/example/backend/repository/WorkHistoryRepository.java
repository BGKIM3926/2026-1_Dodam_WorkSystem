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
                    m.issueDetail,
                    m.equipment,
                    u.name,
                    m.region,
                    COALESCE(d.serviceNameMin, m.serviceName),
                    COALESCE(d.systemNameMin, ''),
                    m.visitDate,
                    m.completedDate,
                    m.constructionStartDate,
                    m.constructionEndDate
                )
                FROM MaintenanceHistory m
                JOIN User u ON m.workerId = u.id
                LEFT JOIN DSystem d ON m.systemId = d.systemId
                WHERE m.serviceName = :serviceName OR d.serviceNameMin = :serviceName
                ORDER BY m.visitDate DESC, m.historyId DESC
            """)
    List<WorkHistoryResponseDto> findWithUserName(String serviceName);

    @Query("""
                SELECT new com.example.backend.dto.WorkHistoryResponseDto(
                    m.historyId,
                    m.workType,
                    m.issue,
                    m.issueDetail,
                    m.equipment,
                    u.name,
                    m.region,
                    COALESCE(d.serviceNameMin, m.serviceName),
                    COALESCE(d.systemNameMin, ''),
                    m.visitDate,
                    m.completedDate,
                    m.constructionStartDate,
                    m.constructionEndDate
                )
                FROM MaintenanceHistory m
                JOIN User u ON m.workerId = u.id
                LEFT JOIN DSystem d ON m.systemId = d.systemId
                ORDER BY m.visitDate DESC, m.historyId DESC
            """)
    List<WorkHistoryResponseDto> findAllWithUserName();

}
