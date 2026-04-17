package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MailResponseDto {

    @JsonProperty("request_id")
    private String requestId;

    private String status;

    public MailResponseDto(String requestId, String status) {
        this.requestId = requestId;
        this.status = status;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
