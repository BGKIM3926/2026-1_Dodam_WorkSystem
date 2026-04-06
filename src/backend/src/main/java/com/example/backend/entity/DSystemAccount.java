package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "dsystemaccount")
@Getter
@Setter
public class DSystemAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SYSTEM_ACCOUNT_ID")
    private int id;

    @Column(name = "SYSTEM_ID")
    private int systemId;

    @Column(name = "SYSTEM_TYPE")
    private String systemType;

    @Column(name = "ACCESS_TYPE")
    private String accessType;

    @Column(name = "PORT_NUMBER")
    private String portNumber;

    @Column(name = "ACCOUNT_ID")
    private String accountId;

    @Column(name = "ACCOUNT_PW")
    private String accountPw;
}