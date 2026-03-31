package com.example.backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AttachmentDto {
    private Long attachmentId;
    private String fileName;
    private List<AttachmentDto> attachments;

    public AttachmentDto(Long attachmentId, String fileName) {
        this.attachmentId = attachmentId;
        this.fileName = fileName;
        this.attachments = null;
    }
}

