package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "system_cpu_usage", indexes = {
        @Index(name = "idx_cpu_origin", columnList = "origin_id")
})
@Getter
@Setter
public class SystemCpuUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "usage_id", nullable = false)
    private Integer usageId;

    @Column(name = "origin_id", nullable = false)
    private Integer originId;

    @Column(name = "cpu_usage", nullable = false)
    private Float cpuUsage;
}
