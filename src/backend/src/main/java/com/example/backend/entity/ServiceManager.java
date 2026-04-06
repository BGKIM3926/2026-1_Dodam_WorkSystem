package com.example.backend.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "service_manager")
@Getter
@Setter
public class ServiceManager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Manager_ID")
    private Long managerId;

    @Column(name = "Service_ID")
    private Long serviceId;

    @Column(name = "Name")
    private String name;

    @Column(name = "Dept")
    private String dept;

    @Column(name = "Phone")
    private String phone;

    @Column(name = "Email")
    private String email;

    @UpdateTimestamp
    @Column(name = "Update_Date")
    private LocalDateTime updateDate;
}
