package com.example.backend.dto;

import lombok.*;

@Getter
public class WorkHistoryResponseDto {

    private Long historyId;
    private String workType;
    private String issue;
    private String equipment;
    private String workerName; // 🔥 추가

    public WorkHistoryResponseDto(Long historyId, String workType, String issue, String equipment, String workerName) {
        this.historyId = historyId;
        this.workType = workType;
        this.issue = issue;
        this.equipment = equipment;
        this.workerName = workerName;
    }
}
