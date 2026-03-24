package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Builder;

@Getter
@Builder
@AllArgsConstructor
public class DSystemAccountDto {

    private String systemType;
    private String accessType;
    private String portNumber;
    private String accountId;
    private String accountPw;
}