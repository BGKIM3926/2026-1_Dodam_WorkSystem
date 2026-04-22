package com.example.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
        name = "mail_reports",
        indexes = {
                @Index(name = "idx_mail_reports_system_id", columnList = "system_id"),
                @Index(name = "idx_mail_reports_inspection_time", columnList = "inspection_time")
        })
@Getter
@Setter
public class MailReport {

    @Id
    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @Column(name = "system_id", nullable = false)
    private Long systemId;

    @Column(name = "inspection_time")
    private LocalDateTime inspectionTime;

    @Column(name = "cpu_usage", precision = 5, scale = 2)
    private BigDecimal cpuUsage;

    @Column(name = "mem_total")
    private Integer memTotal;

    @Column(name = "mem_used")
    private Integer memUsed;

    @Column(name = "mem_available")
    private Integer memAvailable;

    @Column(name = "mem_usage", precision = 5, scale = 2)
    private BigDecimal memUsage;

    @Column(name = "disk_usage", precision = 5, scale = 2)
    private BigDecimal diskUsage;

    @Column(name = "postfix_status", length = 20)
    private String postfixStatus;

    @Column(name = "nginx_status", length = 20)
    private String nginxStatus;

    @Column(name = "parse_status", nullable = false, length = 20)
    private String parseStatus;

    @Column(name = "parse_error", columnDefinition = "TEXT")
    private String parseError;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
