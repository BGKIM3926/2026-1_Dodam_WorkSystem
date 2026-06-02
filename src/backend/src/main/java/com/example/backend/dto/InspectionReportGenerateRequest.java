package com.example.backend.dto;

import java.util.List;

public class InspectionReportGenerateRequest {

    private List<Long> infoIds;

    public List<Long> getInfoIds() {
        return infoIds;
    }

    public void setInfoIds(List<Long> infoIds) {
        this.infoIds = infoIds;
    }
}
