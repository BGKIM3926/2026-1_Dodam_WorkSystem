package com.example.backend.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.Getter;

@Getter
public class WorkHistoryResponseDto {

    private Long historyId;
    private String workType;
    private String issue;
    private String equipment;
    private String workerName; // 🔥 추가
    private String region;
    private String serviceName;
    private String systemName;
    private LocalDate visitDate;
    private List<AttachmentDto> attachments;

    public WorkHistoryResponseDto(Long historyId, String workType, String issue, String equipment, String workerName, String region, String serviceName, String systemName,
            LocalDate visitDate) {
        this.historyId = historyId;
        this.workType = workType;
        this.issue = issue;
        this.equipment = equipment;
        this.workerName = workerName;
        this.region = region;
        this.serviceName = serviceName;
        this.systemName = systemName;
        this.visitDate = visitDate;
    }

    public void setAttachments(List<AttachmentDto> attachments) {
        this.attachments = attachments;
    }
}
