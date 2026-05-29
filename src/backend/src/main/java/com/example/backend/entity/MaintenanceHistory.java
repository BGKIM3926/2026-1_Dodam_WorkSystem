package com.example.backend.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
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

    private Long serviceId;

    private String region;

    private String serviceName;

    @Column(name = "visit_date")
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

    @PrePersist
    public void prePersist() {
        if (visitDate == null) {
            visitDate = LocalDate.now();
        }
    }
}
