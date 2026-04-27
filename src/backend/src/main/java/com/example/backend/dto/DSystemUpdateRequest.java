package com.example.backend.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DSystemUpdateRequest {

    private String customerName;
    private String serviceName;
    private String serviceNameMin;
    private String systemName;
    private String systemNameMin;
    private String hardwareName;
    private String hardwareInfo;
    private String osName;
    private String osIp;
    private String osInfo;
    private String status;

    private List<AccountItem> accounts;

    @Getter
    @Setter
    public static class AccountItem {
        private Integer id;
        private String systemType;
        private String accessType;
        private String portNumber;
        private String accountId;
        private String accountPw;
    }
}
