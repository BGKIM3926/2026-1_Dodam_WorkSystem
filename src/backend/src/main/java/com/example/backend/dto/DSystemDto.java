package com.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DSystemDto {

    private String customerName;
    private String serviceName;
    private String serviceNameMin;
    private String systemName;
    private String systemNameMin;
    private String hardwareName;
    private String hardwareInfo;
    private String osName;
    private String osIp;
    private String osInfo;
}