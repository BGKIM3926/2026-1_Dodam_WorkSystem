package com.example.backend.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
@Table(
        name = "mail_queue_requests",
        indexes = {
                @Index(name = "idx_mail_queue_system_id", columnList = "system_id"),
                @Index(name = "idx_mail_queue_created_at", columnList = "created_at")
        })
@Getter
@Setter
public class MailQueueRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, unique = true, length = 36)
    private String requestId;

    @Column(name = "system_id", nullable = false, length = 100)
    private String systemId;

    @Column(name = "body_raw", nullable = false, columnDefinition = "TEXT")
    private String bodyRaw;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
