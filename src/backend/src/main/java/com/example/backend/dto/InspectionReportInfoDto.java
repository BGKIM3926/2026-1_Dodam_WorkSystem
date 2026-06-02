package com.example.backend.dto;

import java.time.LocalDateTime;

public class InspectionReportInfoDto {

    private Long id;
    private Long systemId;
    private String systemName;
    private LocalDateTime receivedAt;

    public InspectionReportInfoDto(Long id, Long systemId, String systemName, LocalDateTime receivedAt) {
        this.id = id;
        this.systemId = systemId;
        this.systemName = systemName;
        this.receivedAt = receivedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSystemId() {
        return systemId;
    }

    public void setSystemId(Long systemId) {
        this.systemId = systemId;
    }

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }
}
