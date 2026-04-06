package com.example.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.DSystemDto;
import com.example.backend.dto.DSystemUpdateRequest;
import com.example.backend.entity.DSystem;
import com.example.backend.entity.DSystemAccount;
import com.example.backend.repository.DSystemAccountRepository;
import com.example.backend.repository.DSystemRepository;

@Service
public class DSystemService {

    private final DSystemRepository repository;
    private final DSystemAccountRepository accountRepository;

    public DSystemService(DSystemRepository repository, DSystemAccountRepository accountRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public void updateSystemWithAccounts(Long systemId, DSystemUpdateRequest request) {
        DSystem system = repository.findById(systemId)
                .orElseThrow(() -> new RuntimeException("System not found: " + systemId));

        system.setCustomerName(request.getCustomerName());
        system.setServiceName(request.getServiceName());
        system.setServiceNameMin(request.getServiceNameMin());
        system.setSystemName(request.getSystemName());
        system.setSystemNameMin(request.getSystemNameMin());
        system.setHardwareName(request.getHardwareName());
        system.setHardwareInfo(request.getHardwareInfo());
        system.setOsName(request.getOsName());
        system.setOsIp(request.getOsIp());
        system.setOsInfo(request.getOsInfo());
        repository.save(system);

        // 기존 계정 목록 조회
        List<DSystemAccount> existingAccounts = accountRepository.findBySystemId(systemId.intValue());

        if (request.getAccounts() != null) {
            // 요청에 포함된 기존 계정 ID 목록
            java.util.Set<Integer> requestAccountIds = request.getAccounts().stream()
                    .filter(item -> item.getId() != null)
                    .map(DSystemUpdateRequest.AccountItem::getId)
                    .collect(java.util.stream.Collectors.toSet());

            // 요청에 없는 기존 계정 삭제
            for (DSystemAccount existing : existingAccounts) {
                if (!requestAccountIds.contains(existing.getId())) {
                    accountRepository.delete(existing);
                }
            }

            for (DSystemUpdateRequest.AccountItem item : request.getAccounts()) {
                if (item.getId() != null) {
                    DSystemAccount account = accountRepository.findById(item.getId())
                            .orElseThrow(() -> new RuntimeException("Account not found: " + item.getId()));
                    account.setSystemType(item.getSystemType());
                    account.setAccessType(item.getAccessType());
                    account.setPortNumber(item.getPortNumber());
                    account.setAccountId(item.getAccountId());
                    account.setAccountPw(item.getAccountPw());
                    accountRepository.save(account);
                } else {
                    DSystemAccount account = new DSystemAccount();
                    account.setSystemId(systemId.intValue());
                    account.setSystemType(item.getSystemType());
                    account.setAccessType(item.getAccessType());
                    account.setPortNumber(item.getPortNumber());
                    account.setAccountId(item.getAccountId());
                    account.setAccountPw(item.getAccountPw());
                    accountRepository.save(account);
                }
            }
        } else {
            // accounts가 null이면 모든 기존 계정 삭제
            accountRepository.deleteAll(existingAccounts);
        }
    }

    public List<DSystemDto> getAll() {
        return repository.findAll().stream().map(entity -> {
            DSystemDto dto = new DSystemDto();

            dto.setSystemID(entity.getSystemId());
            dto.setCustomerName(entity.getCustomerName());
            dto.setServiceName(entity.getServiceName());
            dto.setServiceNameMin(entity.getServiceNameMin());
            dto.setSystemName(entity.getSystemName());
            dto.setSystemNameMin(entity.getSystemNameMin());
            dto.setHardwareName(entity.getHardwareName());
            dto.setHardwareInfo(entity.getHardwareInfo());
            dto.setOsName(entity.getOsName());
            dto.setOsIp(entity.getOsIp());
            dto.setOsInfo(entity.getOsInfo());
            dto.setServiceId(entity.getServiceId());

            return dto;
        }).toList();
    }

    public List<DSystemDto> getByService(String serviceName, String customerName) {
        return repository
                .findByServiceNameMinAndCustomerName(serviceName, customerName)
                .stream()
                .map(entity -> {
                    DSystemDto dto = new DSystemDto();

                    dto.setSystemID(entity.getSystemId());
                    dto.setCustomerName(entity.getCustomerName());
                    dto.setServiceName(entity.getServiceName());
                    dto.setServiceNameMin(entity.getServiceNameMin());
                    dto.setSystemName(entity.getSystemName());
                    dto.setSystemNameMin(entity.getSystemNameMin());
                    dto.setHardwareName(entity.getHardwareName());
                    dto.setHardwareInfo(entity.getHardwareInfo());
                    dto.setOsName(entity.getOsName());
                    dto.setOsIp(entity.getOsIp());
                    dto.setOsInfo(entity.getOsInfo());
                    dto.setServiceId(entity.getServiceId());

                    return dto;
                })
                .toList();
    }
}