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
@Table(name = "system_status_origin", indexes = {
        @Index(name = "fk_system_status_origin_dsystem", columnList = "dsystem_id")
})
@Getter
@Setter
public class SystemStatusOrigin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "origin_id", nullable = false)
    private Integer originId;

    @Column(name = "body_raw", columnDefinition = "TEXT")
    private String bodyRaw;

    @Column(name = "dsystem_id", nullable = false)
    private Integer dsystemId;

    @Column(name = "time")
    private LocalDateTime time;
}
