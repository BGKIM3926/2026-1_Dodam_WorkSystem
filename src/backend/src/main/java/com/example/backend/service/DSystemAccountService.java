package com.example.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.backend.dto.DSystemAccountDto;
import com.example.backend.repository.DSystemAccountRepository;

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
                        acc.getId(),
                        acc.getSystemType(),
                        acc.getAccessType(),
                        acc.getPortNumber(),
                        acc.getAccountId(),
                        acc.getAccountPw()))
                .toList();
    }
}