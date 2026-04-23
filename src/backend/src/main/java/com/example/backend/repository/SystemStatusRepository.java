package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.SystemStatus;

@Repository
public interface SystemStatusRepository extends JpaRepository<SystemStatus, Integer> {

    interface QueueStatusRow {
        Integer getOriginId();

        Integer getDsystemId();

        String getCustomerName();

        String getSystemName();

        String getTotalStatus();
    }

    @Query(value = """
            SELECT
                ss.origin_id AS originId,
                sso.dsystem_id AS dsystemId,
                COALESCE(d.Customer_Name, '') AS customerName,
                COALESCE(d.System_Name_Min, '') AS systemName,
                ss.total_status AS totalStatus
            FROM system_status ss
            JOIN system_status_origin sso
              ON ss.origin_id = sso.origin_id
            JOIN dsystem d
              ON d.System_ID = sso.dsystem_id
            JOIN (
                SELECT
                    sso2.dsystem_id AS dsystem_id,
                    MAX(ss2.status_id) AS max_status_id
                FROM system_status ss2
                JOIN system_status_origin sso2
                  ON ss2.origin_id = sso2.origin_id
                GROUP BY sso2.dsystem_id
            ) latest
              ON latest.max_status_id = ss.status_id
            ORDER BY d.Customer_Name ASC, d.System_Name_Min ASC
            """, nativeQuery = true)
    List<QueueStatusRow> findLatestQueueStatusRows();
}
