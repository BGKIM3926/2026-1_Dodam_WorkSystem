package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "dsystem")
@Getter
@Setter
public class DSystem {

    @Id
    @Column(name = "System_ID")
    private Long systemId;

    @Column(name = "Customer_Name")
    private String customerName;

    @Column(name = "Service_Name")
    private String serviceName;

    @Column(name = "Service_Name_Min")
    private String serviceNameMin;

    @Column(name = "System_Name")
    private String systemName;

    @Column(name = "System_Name_Min")
    private String systemNameMin;

    @Column(name = "Hardware_Name")
    private String hardwareName;

    @Column(name = "Hardware_Info")
    private String hardwareInfo;

    @Column(name = "OS_Name")
    private String osName;

    @Column(name = "OS_IP")
    private String osIp;

    @Column(name = "OS_Info")
    private String osInfo;

    @Column(name = "status", length = 30)
    private String status;

    @Column(name = "Service_ID")
    private Long serviceId;

    @Column(name = "version", length = 10)
    private String version = "신";

    @Column(name = "manager", length = 10)
    private String manager = "조상현";
}
