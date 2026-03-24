package com.example.backend.service;

import com.example.backend.dto.DSystemAccountDto;
import com.example.backend.repository.DSystemAccountRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DSystemAccountService {

    private final DSystemAccountRepository repository;

    public DSystemAccountService(DSystemAccountRepository repository) {
        this.repository = repository;
    }

    public List<DSystemAccountDto> getAccountsBySystemId(int systemId) {
        return repository.findBySystemId(systemId)
                .stream()
                .map(acc -> new DSystemAccountDto(
                        acc.getSystemType(),
                        acc.getAccessType(),
                        acc.getPortNumber(),
                        acc.getAccountId(),
                        acc.getAccountPw()))
                .toList();
    }
}