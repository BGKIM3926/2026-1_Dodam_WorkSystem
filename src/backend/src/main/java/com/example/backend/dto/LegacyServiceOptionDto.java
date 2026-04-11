package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LegacyServiceOptionDto {
    private Long serviceId;
    private String customerName;
    private String serviceName;
    private boolean legacy;
}

