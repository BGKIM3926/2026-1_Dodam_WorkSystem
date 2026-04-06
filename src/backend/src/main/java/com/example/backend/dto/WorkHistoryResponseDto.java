package com.example.backend.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.Getter;

@Getter
public class WorkHistoryResponseDto {

    private Long historyId;
    private String workType;
    private String issue;
    private String issueDetail;
    private String equipment;
    private String workerName;
    private String region;
    private String serviceName;
    private String systemName;
    private LocalDate visitDate;
    private LocalDate completedDate;
    private LocalDate constructionStartDate;
    private LocalDate constructionEndDate;
    private List<AttachmentDto> attachments;

    public WorkHistoryResponseDto(Long historyId, String workType, String issue, String issueDetail, String equipment, String workerName, String region, String serviceName, String systemName,
            LocalDate visitDate, LocalDate completedDate, LocalDate constructionStartDate, LocalDate constructionEndDate) {
        this.historyId = historyId;
        this.workType = workType;
        this.issue = issue;
        this.issueDetail = issueDetail;
        this.equipment = equipment;
        this.workerName = workerName;
        this.region = region;
        this.serviceName = serviceName;
        this.systemName = systemName;
        this.visitDate = visitDate;
        this.completedDate = completedDate;
        this.constructionStartDate = constructionStartDate;
        this.constructionEndDate = constructionEndDate;
    }

    public void setAttachments(List<AttachmentDto> attachments) {
        this.attachments = attachments;
    }
}
