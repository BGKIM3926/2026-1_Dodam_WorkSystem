package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class HistorySubResponseDto {
    private Long subId;
    private Long historyId;
    private String content;
    private String contentDetail;
    private LocalDateTime createdAt;
    private List<AttachmentDto> attachments;

    public HistorySubResponseDto(Long subId, Long historyId, String content, String contentDetail, LocalDateTime createdAt) {
        this.subId = subId;
        this.historyId = historyId;
        this.content = content;
        this.contentDetail = contentDetail;
        this.createdAt = createdAt;
    }
}
