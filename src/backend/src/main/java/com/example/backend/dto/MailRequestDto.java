package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MailRequestDto {

    @JsonProperty("system_id")
    private String systemId;

    private String body;

    public String getSystemId() {
        return systemId;
    }

    public void setSystemId(String systemId) {
        this.systemId = systemId;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
}
