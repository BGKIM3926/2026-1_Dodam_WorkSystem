package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DSystemAccountDto {

    private int id;
    private String systemType;
    private String accessType;
    private String portNumber;
    private String accountId;
    private String accountPw;
}