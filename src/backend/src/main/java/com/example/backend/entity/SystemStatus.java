package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "system_status", indexes = {
        @Index(name = "fk_system_status_origin", columnList = "origin_id")
})
@Getter
@Setter
public class SystemStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "status_id", nullable = false)
    private Integer statusId;

    @Column(name = "origin_id", nullable = false)
    private Integer originId;

    @Enumerated(EnumType.STRING)
    @Column(name = "mem_status", nullable = false, length = 7)
    private ResourceStatus memStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "disk_status", nullable = false, length = 7)
    private ResourceStatus diskStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_status", nullable = false, length = 6)
    private ServiceHealthStatus serviceStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "security_status", nullable = false, length = 6)
    private ServiceHealthStatus securityStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "total_status", nullable = false, length = 6)
    private ServiceHealthStatus totalStatus;

    @Column(name = "time", nullable = false)
    private java.time.LocalDateTime time;
}
