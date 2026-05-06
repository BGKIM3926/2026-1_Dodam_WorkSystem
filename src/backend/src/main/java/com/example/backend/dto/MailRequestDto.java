package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MailRequestDto {

    @JsonProperty("system_id")
    private String systemId;

    private String content;

    public String getSystemId() {
        return systemId;
    }

    public void setSystemId(String systemId) {
        this.systemId = systemId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
