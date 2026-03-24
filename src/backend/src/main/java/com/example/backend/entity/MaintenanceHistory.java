package com.example.backend.entity;

import jakarta.persistence.*;
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

    // private LocalDate visitDate;

    private String workerId;

    private String workType;

    @Column(columnDefinition = "TEXT")
    private String issue;

    @Column(columnDefinition = "TEXT")
    private String action;

    @Column(columnDefinition = "TEXT")
    private String support;

    private String equipment;

    private String createdBy;

   // private LocalDateTime createdAt;
}
