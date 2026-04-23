package com.example.backend.entity;

import java.time.LocalDateTime;

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
@Table(name = "system_security_log", indexes = {
        @Index(name = "idx_security_log_origin", columnList = "origin_id"),
        @Index(name = "idx_security_log_time", columnList = "time")
})
@Getter
@Setter
public class SystemSecurityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "security_log_id", nullable = false)
    private Integer securityLogId;

    @Column(name = "origin_id", nullable = false)
    private Integer originId;

    @Column(name = "log_detail", nullable = false, columnDefinition = "TEXT")
    private String logDetail;

    @Column(name = "time", nullable = false)
    private LocalDateTime time;
}
