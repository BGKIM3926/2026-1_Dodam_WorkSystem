package com.example.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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
        return repository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional
    public void createSystemWithAccounts(DSystemUpdateRequest request) {
        String customerName = trimToNull(request.getCustomerName());
        String serviceNameMin = trimToNull(request.getServiceNameMin());
        String systemNameMin = trimToNull(request.getSystemNameMin());

        if (customerName == null) {
            throw new IllegalArgumentException("사이트명은 필수 입력값입니다.");
        }
        if (serviceNameMin == null) {
            throw new IllegalArgumentException("서비스명은 필수 입력값입니다.");
        }
        if (systemNameMin == null) {
            throw new IllegalArgumentException("시스템명은 필수 입력값입니다.");
        }

        Long nextSystemId = repository.findMaxSystemId() + 1;
        Long mappedServiceId = repository
                .findFirstByCustomerNameAndServiceNameMinAndServiceIdIsNotNullOrderBySystemIdAsc(customerName, serviceNameMin)
                .map(DSystem::getServiceId)
                .orElseGet(() -> repository.findMaxServiceId() + 1);

        DSystem system = new DSystem();
        system.setSystemId(nextSystemId);
        system.setCustomerName(customerName);
        system.setServiceName(trimToNull(request.getServiceName()) == null ? serviceNameMin : trimToNull(request.getServiceName()));
        system.setServiceNameMin(serviceNameMin);
        system.setSystemName(trimToNull(request.getSystemName()) == null ? systemNameMin : trimToNull(request.getSystemName()));
        system.setSystemNameMin(systemNameMin);
        system.setHardwareName(trimToNull(request.getHardwareName()));
        system.setHardwareInfo(trimToNull(request.getHardwareInfo()));
        system.setOsName(trimToNull(request.getOsName()));
        system.setOsIp(trimToNull(request.getOsIp()));
        system.setOsInfo(trimToNull(request.getOsInfo()));
        system.setServiceId(mappedServiceId);
        repository.save(system);

        if (request.getAccounts() == null) {
            return;
        }

        for (DSystemUpdateRequest.AccountItem item : request.getAccounts()) {
            if (isAccountEmpty(item)) {
                continue;
            }
            DSystemAccount account = new DSystemAccount();
            account.setSystemId(nextSystemId.intValue());
            account.setSystemType(trimToNull(item.getSystemType()));
            account.setAccessType(trimToNull(item.getAccessType()));
            account.setPortNumber(trimToNull(item.getPortNumber()));
            account.setAccountId(trimToNull(item.getAccountId()));
            account.setAccountPw(trimToNull(item.getAccountPw()));
            accountRepository.save(account);
        }
    }

    public List<DSystemDto> getByService(String serviceName, String customerName) {
        return repository
                .findByServiceNameMinAndCustomerName(serviceName, customerName)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public byte[] exportDSystemExcel(String customerName) {
        List<DSystem> systems = getSystemsByCustomerName(customerName);

        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("dsystem");
            createHeaderRow(sheet, "SYSTEM_ID", "CUSTOMER_NAME", "SERVICE_NAME", "SERVICE_NAME_MIN", "SYSTEM_NAME",
                    "SYSTEM_NAME_MIN", "HARDWARE_NAME", "HARDWARE_INFO", "OS_NAME", "OS_IP", "OS_INFO", "SERVICE_ID");

            int rowIndex = 1;
            for (DSystem system : systems) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(valueOf(system.getSystemId()));
                row.createCell(1).setCellValue(valueOf(system.getCustomerName()));
                row.createCell(2).setCellValue(valueOf(system.getServiceName()));
                row.createCell(3).setCellValue(valueOf(system.getServiceNameMin()));
                row.createCell(4).setCellValue(valueOf(system.getSystemName()));
                row.createCell(5).setCellValue(valueOf(system.getSystemNameMin()));
                row.createCell(6).setCellValue(valueOf(system.getHardwareName()));
                row.createCell(7).setCellValue(valueOf(system.getHardwareInfo()));
                row.createCell(8).setCellValue(valueOf(system.getOsName()));
                row.createCell(9).setCellValue(valueOf(system.getOsIp()));
                row.createCell(10).setCellValue(valueOf(system.getOsInfo()));
                row.createCell(11).setCellValue(valueOf(system.getServiceId()));
            }

            autosizeColumns(sheet, 12);
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to generate dsystem export file.", ex);
        }
    }

    public byte[] exportDSystemAccountExcel(String customerName) {
        List<DSystem> systems = getSystemsByCustomerName(customerName);
        List<Integer> systemIds = systems.stream()
                .map(DSystem::getSystemId)
                .filter(id -> id != null)
                .map(Math::toIntExact)
                .toList();

        List<DSystemAccount> accounts = systemIds.isEmpty()
                ? new ArrayList<>()
                : accountRepository.findBySystemIdIn(systemIds);

        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("dsystemaccount");
            createHeaderRow(sheet, "SYSTEM_ACCOUNT_ID", "SYSTEM_ID", "SYSTEM_TYPE", "ACCESS_TYPE", "PORT_NUMBER",
                    "ACCOUNT_ID", "ACCOUNT_PW");

            int rowIndex = 1;
            for (DSystemAccount account : accounts) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(valueOf(account.getId()));
                row.createCell(1).setCellValue(valueOf(account.getSystemId()));
                row.createCell(2).setCellValue(valueOf(account.getSystemType()));
                row.createCell(3).setCellValue(valueOf(account.getAccessType()));
                row.createCell(4).setCellValue(valueOf(account.getPortNumber()));
                row.createCell(5).setCellValue(valueOf(account.getAccountId()));
                row.createCell(6).setCellValue(valueOf(account.getAccountPw()));
            }

            autosizeColumns(sheet, 7);
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to generate dsystemaccount export file.", ex);
        }
    }

    private DSystemDto toDto(DSystem entity) {
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
    }

    private List<DSystem> getSystemsByCustomerName(String customerName) {
        if (customerName == null || customerName.isBlank()) {
            return repository.findAll();
        }
        return repository.findByCustomerName(customerName);
    }

    private void createHeaderRow(Sheet sheet, String... headers) {
        Row header = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            header.createCell(i).setCellValue(headers[i]);
        }
    }

    private void autosizeColumns(Sheet sheet, int count) {
        for (int i = 0; i < count; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private String valueOf(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isAccountEmpty(DSystemUpdateRequest.AccountItem item) {
        if (item == null) {
            return true;
        }

        return java.util.stream.Stream.of(
                item.getSystemType(),
                item.getAccessType(),
                item.getPortNumber(),
                item.getAccountId(),
                item.getAccountPw()
        ).allMatch(value -> value == null || value.trim().isEmpty());
    }
}
