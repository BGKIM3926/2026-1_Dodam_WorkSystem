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
                    u.name
                )
                FROM MaintenanceHistory m
                JOIN User u ON m.workerId = u.id
                WHERE m.systemId = :systemId
            """)
    List<WorkHistoryResponseDto> findWithUserName(Long systemId);

}
