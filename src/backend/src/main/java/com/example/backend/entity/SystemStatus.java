package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "system_status")
@Getter
@Setter
public class SystemStatus {

    @Id
    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "mem_status", nullable = false, length = 20)
    private ResourceStatus memStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "disk_status", nullable = false, length = 20)
    private ResourceStatus diskStatus;
}
