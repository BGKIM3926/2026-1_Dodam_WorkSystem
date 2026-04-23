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
@Table(name = "system_disk_usage", indexes = {
        @Index(name = "idx_disk_origin", columnList = "origin_id")
})
@Getter
@Setter
public class SystemDiskUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "usage_id", nullable = false)
    private Integer usageId;

    @Column(name = "origin_id", nullable = false)
    private Integer originId;

    @Column(name = "disk_name", nullable = false, length = 100)
    private String diskName;

    @Column(name = "disk_usage", nullable = false)
    private Float diskUsage;
}
