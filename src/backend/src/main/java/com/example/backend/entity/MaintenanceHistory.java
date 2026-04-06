package com.example.backend.entity;

import java.time.LocalDate;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "maintenance_history")
@Getter
@Setter
public class MaintenanceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long historyId;

    private Long systemId;

    private String region;

    private String serviceName;

    @CreationTimestamp
    @Column(name = "visit_date", updatable = false)
    private LocalDate visitDate;

    private String workerId;

    private String workType;

    @Column(columnDefinition = "TEXT")
    private String issue;

    @Column(columnDefinition = "TEXT")
    private String action;

    @Column(columnDefinition = "TEXT")
    private String support;

    private String equipment;

    @Column(columnDefinition = "TEXT")
    private String issueDetail;

    private LocalDate completedDate;

    private LocalDate constructionStartDate;

    private LocalDate constructionEndDate;

    private String createdBy;
}
