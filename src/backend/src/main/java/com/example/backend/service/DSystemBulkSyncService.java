package com.example.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.dto.BulkSyncApplyResponseDto;
import com.example.backend.dto.BulkSyncChangeItemDto;
import com.example.backend.dto.BulkSyncPreviewResponseDto;
import com.example.backend.dto.BulkSyncSummaryDto;
import com.example.backend.entity.DSystem;
import com.example.backend.entity.DSystemAccount;
import com.example.backend.repository.DSystemAccountRepository;
import com.example.backend.repository.DSystemRepository;

@Service
public class DSystemBulkSyncService {
    private final DSystemRepository dSystemRepository;
    private final DSystemAccountRepository dSystemAccountRepository;

    private static final List<String> DSYSTEM_COMPARE_FIELDS = List.of(
            "customerName", "serviceName", "serviceNameMin", "systemName", "systemNameMin",
            "hardwareName", "hardwareInfo", "osName", "osIp", "osInfo", "serviceId");

    private static final List<String> ACCOUNT_COMPARE_FIELDS = List.of(
            "systemId", "systemType", "accessType", "portNumber", "accountId", "accountPw");

    public DSystemBulkSyncService(
            DSystemRepository dSystemRepository,
            DSystemAccountRepository dSystemAccountRepository
    ) {
        this.dSystemRepository = dSystemRepository;
        this.dSystemAccountRepository = dSystemAccountRepository;
    }

    public BulkSyncPreviewResponseDto previewDSystem(MultipartFile file) {
        validateExcelFile(file, "dsystem");
        List<DSystemExcelRow> uploadedRows = readDSystemRows(file);
        ComparisonResult comparison = compareDSystem(uploadedRows);
        return new BulkSyncPreviewResponseDto("dsystem", comparison.summary, comparison.changes);
    }

    public BulkSyncPreviewResponseDto previewDSystemAccount(MultipartFile file) {
        validateExcelFile(file, "dsystemaccount");
        List<DSystemAccountExcelRow> uploadedRows = readDSystemAccountRows(file);
        ComparisonResult comparison = compareDSystemAccount(uploadedRows);
        return new BulkSyncPreviewResponseDto("dsystemaccount", comparison.summary, comparison.changes);
    }

    @Transactional
    public BulkSyncApplyResponseDto apply(
            MultipartFile dsystemFile,
            boolean dsystemNoChange,
            MultipartFile dsystemAccountFile,
            boolean dsystemAccountNoChange
    ) {
        ComparisonResult dsystemComparison = null;
        if (!dsystemNoChange) {
            validateExcelFile(dsystemFile, "dsystem");
            List<DSystemExcelRow> dsystemRows = readDSystemRows(dsystemFile);
            dsystemComparison = compareDSystem(dsystemRows);
            applyDSystemChanges(dsystemRows);
        }

        ComparisonResult dsystemAccountComparison = null;
        if (!dsystemAccountNoChange) {
            validateExcelFile(dsystemAccountFile, "dsystemaccount");
            List<DSystemAccountExcelRow> accountRows = readDSystemAccountRows(dsystemAccountFile);
            dsystemAccountComparison = compareDSystemAccount(accountRows);
            applyDSystemAccountChanges(accountRows);
        }

        BulkSyncSummaryDto dsystemSummary = dsystemComparison != null
                ? dsystemComparison.summary
                : new BulkSyncSummaryDto(0, 0, 0);
        BulkSyncSummaryDto dsystemAccountSummary = dsystemAccountComparison != null
                ? dsystemAccountComparison.summary
                : new BulkSyncSummaryDto(0, 0, 0);

        return new BulkSyncApplyResponseDto("엑셀 일괄 최신화가 완료되었습니다.", dsystemSummary, dsystemAccountSummary);
    }

    private void applyDSystemChanges(List<DSystemExcelRow> uploadedRows) {
        Map<Long, DSystem> existingMap = dSystemRepository.findAll().stream()
                .collect(Collectors.toMap(DSystem::getSystemId, Function.identity()));

        Set<Long> uploadedIds = uploadedRows.stream()
                .map(DSystemExcelRow::systemId)
                .collect(Collectors.toSet());

        List<DSystem> toSave = new ArrayList<>();
        for (DSystemExcelRow row : uploadedRows) {
            DSystem entity = existingMap.getOrDefault(row.systemId(), new DSystem());
            entity.setSystemId(row.systemId());
            entity.setCustomerName(row.customerName());
            entity.setServiceName(row.serviceName());
            entity.setServiceNameMin(row.serviceNameMin());
            entity.setSystemName(row.systemName());
            entity.setSystemNameMin(row.systemNameMin());
            entity.setHardwareName(row.hardwareName());
            entity.setHardwareInfo(row.hardwareInfo());
            entity.setOsName(row.osName());
            entity.setOsIp(row.osIp());
            entity.setOsInfo(row.osInfo());
            entity.setServiceId(row.serviceId());
            toSave.add(entity);
        }
        dSystemRepository.saveAll(toSave);

        List<DSystem> toDelete = existingMap.values().stream()
                .filter(entity -> !uploadedIds.contains(entity.getSystemId()))
                .toList();
        if (!toDelete.isEmpty()) {
            dSystemRepository.deleteAll(toDelete);
        }
    }

    private void applyDSystemAccountChanges(List<DSystemAccountExcelRow> uploadedRows) {
        List<DSystemAccount> existingAccounts = dSystemAccountRepository.findAll();

        Map<Integer, DSystemAccount> existingById = existingAccounts.stream()
                .collect(Collectors.toMap(DSystemAccount::getId, Function.identity()));

        Set<Integer> matchedExistingIds = new LinkedHashSet<>();
        List<DSystemAccount> toSave = new ArrayList<>();

        for (DSystemAccountExcelRow row : uploadedRows) {
            Optional<DSystemAccount> existingOpt = findExistingAccount(row, existingById);
            DSystemAccount entity = existingOpt.orElseGet(DSystemAccount::new);
            entity.setId(row.id());

            entity.setSystemId(Math.toIntExact(row.systemId()));
            entity.setSystemType(row.systemType());
            entity.setAccessType(row.accessType());
            entity.setPortNumber(row.portNumber());
            entity.setAccountId(row.accountId());
            entity.setAccountPw(row.accountPw());
            toSave.add(entity);

            existingOpt.ifPresent(existing -> matchedExistingIds.add(existing.getId()));
        }

        dSystemAccountRepository.saveAll(toSave);

        List<DSystemAccount> toDelete = existingAccounts.stream()
                .filter(existing -> !matchedExistingIds.contains(existing.getId()))
                .toList();
        if (!toDelete.isEmpty()) {
            dSystemAccountRepository.deleteAll(toDelete);
        }
    }

    private ComparisonResult compareDSystem(List<DSystemExcelRow> uploadedRows) {
        Map<Long, DSystem> existingMap = dSystemRepository.findAll().stream()
                .collect(Collectors.toMap(DSystem::getSystemId, Function.identity()));
        Map<Long, DSystemExcelRow> uploadedMap = uploadedRows.stream()
                .collect(Collectors.toMap(DSystemExcelRow::systemId, Function.identity(), (a, b) -> {
                    throw new IllegalArgumentException("중복된 dsystem System_ID가 업로드 파일에 있습니다: " + a.systemId());
                }));

        List<BulkSyncChangeItemDto> changes = new ArrayList<>();
        int created = 0;
        int updated = 0;
        int deleted = 0;

        for (Map.Entry<Long, DSystemExcelRow> entry : uploadedMap.entrySet()) {
            DSystem existing = existingMap.get(entry.getKey());
            if (existing == null) {
                created++;
                changes.add(new BulkSyncChangeItemDto(
                        "NEW",
                        "systemId=" + entry.getKey(),
                        List.of(),
                        Map.of(),
                        toDSystemMap(entry.getValue())));
                continue;
            }

            Map<String, String> currentMap = toDSystemMap(existing);
            Map<String, String> uploadedMapValue = toDSystemMap(entry.getValue());
            List<String> changedFields = getChangedFields(currentMap, uploadedMapValue, DSYSTEM_COMPARE_FIELDS);
            if (!changedFields.isEmpty()) {
                updated++;
                changes.add(new BulkSyncChangeItemDto(
                        "UPDATED",
                        "systemId=" + entry.getKey(),
                        changedFields,
                        currentMap,
                        uploadedMapValue));
            }
        }

        for (DSystem existing : existingMap.values()) {
            if (!uploadedMap.containsKey(existing.getSystemId())) {
                deleted++;
                changes.add(new BulkSyncChangeItemDto(
                        "DELETED",
                        "systemId=" + existing.getSystemId(),
                        List.of(),
                        toDSystemMap(existing),
                        Map.of()));
            }
        }

        return new ComparisonResult(new BulkSyncSummaryDto(created, updated, deleted), changes);
    }

    private ComparisonResult compareDSystemAccount(List<DSystemAccountExcelRow> uploadedRows) {
        List<DSystemAccount> existingAccounts = dSystemAccountRepository.findAll();
        Map<Integer, DSystemAccount> existingById = existingAccounts.stream()
                .collect(Collectors.toMap(DSystemAccount::getId, Function.identity()));

        Set<String> uploadedKeys = new LinkedHashSet<>();
        Set<Integer> matchedExistingIds = new LinkedHashSet<>();
        List<BulkSyncChangeItemDto> changes = new ArrayList<>();
        int created = 0;
        int updated = 0;

        for (DSystemAccountExcelRow row : uploadedRows) {
            String uploadedKey = "id=" + row.id();
            if (!uploadedKeys.add(uploadedKey)) {
                throw new IllegalArgumentException("중복된 dsystemaccount 키가 업로드 파일에 있습니다: " + uploadedKey);
            }

            Optional<DSystemAccount> existingOpt = findExistingAccount(row, existingById);
            if (existingOpt.isEmpty()) {
                created++;
                changes.add(new BulkSyncChangeItemDto(
                        "NEW",
                        uploadedKey,
                        List.of(),
                        Map.of(),
                        toDSystemAccountMap(row)));
                continue;
            }

            DSystemAccount existing = existingOpt.get();
            matchedExistingIds.add(existing.getId());

            Map<String, String> currentMap = toDSystemAccountMap(existing);
            Map<String, String> uploadedMap = toDSystemAccountMap(row);
            List<String> changedFields = getChangedFields(currentMap, uploadedMap, ACCOUNT_COMPARE_FIELDS);
            if (!changedFields.isEmpty()) {
                updated++;
                changes.add(new BulkSyncChangeItemDto(
                        "UPDATED",
                        "id=" + existing.getId(),
                        changedFields,
                        currentMap,
                        uploadedMap));
            }
        }

        int deleted = 0;
        for (DSystemAccount existing : existingAccounts) {
            if (!matchedExistingIds.contains(existing.getId())) {
                deleted++;
                changes.add(new BulkSyncChangeItemDto(
                        "DELETED",
                        "id=" + existing.getId(),
                        List.of(),
                        toDSystemAccountMap(existing),
                        Map.of()));
            }
        }

        return new ComparisonResult(new BulkSyncSummaryDto(created, updated, deleted), changes);
    }

    private Optional<DSystemAccount> findExistingAccount(
            DSystemAccountExcelRow row,
            Map<Integer, DSystemAccount> existingById
    ) {
        return Optional.ofNullable(existingById.get(row.id()));
    }

    private List<String> getChangedFields(
            Map<String, String> currentMap,
            Map<String, String> uploadedMap,
            Collection<String> targetFields
    ) {
        return targetFields.stream()
                .filter(field -> !Objects.equals(normalize(currentMap.get(field)), normalize(uploadedMap.get(field))))
                .toList();
    }

    private void validateExcelFile(MultipartFile file, String target) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(target + " 파일이 비어 있습니다.");
        }
        String filename = Optional.ofNullable(file.getOriginalFilename()).orElse("").toLowerCase(Locale.ROOT);
        if (!(filename.endsWith(".xlsx") || filename.endsWith(".xls"))) {
            throw new IllegalArgumentException(target + " 파일은 .xlsx 또는 .xls 형식만 업로드할 수 있습니다.");
        }
    }

    private List<DSystemExcelRow> readDSystemRows(MultipartFile file) {
        List<Map<String, String>> rows = readRawRows(file);
        List<DSystemExcelRow> result = new ArrayList<>();
        for (Map<String, String> row : rows) {
            Long systemId = parseLong(row.get("systemId"), "systemId(System_ID)");
            if (systemId == null) {
                throw new IllegalArgumentException("dsystem 업로드 파일에 systemId(System_ID) 값이 없는 행이 있습니다.");
            }
            Long serviceId = parseLong(row.get("serviceId"), "serviceId(Service_ID)");
            if (serviceId == null) {
                throw new IllegalArgumentException("dsystem 업로드 파일에 serviceId(Service_ID) 값이 없는 행이 있습니다.");
            }

            result.add(new DSystemExcelRow(
                    systemId,
                    nullable(row.get("customerName")),
                    nullable(row.get("serviceName")),
                    nullable(row.get("serviceNameMin")),
                    nullable(row.get("systemName")),
                    nullable(row.get("systemNameMin")),
                    nullable(row.get("hardwareName")),
                    nullable(row.get("hardwareInfo")),
                    nullable(row.get("osName")),
                    nullable(row.get("osIp")),
                    nullable(row.get("osInfo")),
                    serviceId));
        }
        return result;
    }

    private List<DSystemAccountExcelRow> readDSystemAccountRows(MultipartFile file) {
        List<Map<String, String>> rows = readRawRows(file);
        List<DSystemAccountExcelRow> result = new ArrayList<>();
        for (Map<String, String> row : rows) {
            Long systemId = parseLong(row.get("systemId"), "systemId(SYSTEM_ID)");
            if (systemId == null) {
                throw new IllegalArgumentException("dsystemaccount 업로드 파일에 systemId(SYSTEM_ID) 값이 없는 행이 있습니다.");
            }
            Integer id = parseInteger(row.get("id"), "id(SYSTEM_ACCOUNT_ID)");
            if (id == null) {
                throw new IllegalArgumentException("dsystemaccount 업로드 파일에 id(SYSTEM_ACCOUNT_ID) 값이 없는 행이 있습니다.");
            }

            result.add(new DSystemAccountExcelRow(
                    id,
                    systemId,
                    nullable(row.get("systemType")),
                    nullable(row.get("accessType")),
                    nullable(row.get("portNumber")),
                    nullable(row.get("accountId")),
                    nullable(row.get("accountPw"))));
        }
        return result;
    }

    private List<Map<String, String>> readRawRows(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                throw new IllegalArgumentException("엑셀 파일에 데이터가 없습니다.");
            }

            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                throw new IllegalArgumentException("엑셀 파일 헤더를 읽을 수 없습니다.");
            }

            Map<Integer, String> columnByIndex = resolveColumns(headerRow);
            DataFormatter formatter = new DataFormatter();
            List<Map<String, String>> rows = new ArrayList<>();

            int firstDataRow = headerRow.getRowNum() + 1;
            for (int rowIndex = firstDataRow; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null) {
                    continue;
                }

                Map<String, String> mapped = new HashMap<>();
                boolean hasValue = false;
                for (Map.Entry<Integer, String> entry : columnByIndex.entrySet()) {
                    Cell cell = row.getCell(entry.getKey(), Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    String value = cell == null ? null : nullable(formatter.formatCellValue(cell));
                    if (value != null) {
                        hasValue = true;
                    }
                    mapped.put(entry.getValue(), value);
                }
                if (hasValue) {
                    rows.add(mapped);
                }
            }
            return rows;
        } catch (IOException ex) {
            throw new IllegalArgumentException("엑셀 파일을 읽는 중 오류가 발생했습니다.", ex);
        }
    }

    private Map<Integer, String> resolveColumns(Row headerRow) {
        Map<Integer, String> resolved = new LinkedHashMap<>();
        for (Cell cell : headerRow) {
            String rawHeader = nullable(cell.getStringCellValue());
            if (rawHeader == null) {
                continue;
            }
            String canonical = canonicalizeHeader(rawHeader);
            if (canonical != null) {
                resolved.put(cell.getColumnIndex(), canonical);
            }
        }
        if (resolved.isEmpty()) {
            throw new IllegalArgumentException("엑셀 헤더를 인식하지 못했습니다. 템플릿 헤더명을 확인해 주세요.");
        }
        return resolved;
    }

    private String canonicalizeHeader(String header) {
        String normalized = normalizeHeader(header);
        for (Map.Entry<String, List<String>> entry : headerAliases().entrySet()) {
            if (entry.getValue().contains(normalized)) {
                return entry.getKey();
            }
        }
        return null;
    }

    private Map<String, List<String>> headerAliases() {
        Map<String, List<String>> aliases = new LinkedHashMap<>();

        aliases.put("id", aliases("id", "systemaccountid", "system_account_id", "계정id"));
        aliases.put("systemId", aliases("systemid", "system_id", "시스템id"));
        aliases.put("customerName", aliases("customername", "customer_name", "고객명"));
        aliases.put("serviceName", aliases("servicename", "service_name", "서비스명"));
        aliases.put("serviceNameMin", aliases("servicenamemin", "service_name_min", "서비스명약어", "서비스약어"));
        aliases.put("systemName", aliases("systemname", "system_name", "시스템명"));
        aliases.put("systemNameMin", aliases("systemnamemin", "system_name_min", "시스템명약어"));
        aliases.put("hardwareName", aliases("hardwarename", "hardware_name", "하드웨어명"));
        aliases.put("hardwareInfo", aliases("hardwareinfo", "hardware_info", "하드웨어정보"));
        aliases.put("osName", aliases("osname", "os_name", "os명"));
        aliases.put("osIp", aliases("osip", "os_ip", "ip", "osip주소"));
        aliases.put("osInfo", aliases("osinfo", "os_info", "os정보"));
        aliases.put("serviceId", aliases("serviceid", "service_id"));

        aliases.put("systemType", aliases("systemtype", "system_type", "구분", "시스템구분"));
        aliases.put("accessType", aliases("accesstype", "access_type", "접속방식"));
        aliases.put("portNumber", aliases("portnumber", "port_number", "포트"));
        aliases.put("accountId", aliases("accountid", "account_id", "계정명"));
        aliases.put("accountPw", aliases("accountpw", "account_pw", "패스워드", "비밀번호"));

        return aliases;
    }

    private List<String> aliases(String... values) {
        return Arrays.stream(values)
                .map(this::normalizeHeader)
                .toList();
    }

    private String normalizeHeader(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[\\s_\\-\\(\\)\\[\\]]", "");
    }

    private Map<String, String> toDSystemMap(DSystem entity) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("systemId", safe(entity.getSystemId()));
        values.put("customerName", safe(entity.getCustomerName()));
        values.put("serviceName", safe(entity.getServiceName()));
        values.put("serviceNameMin", safe(entity.getServiceNameMin()));
        values.put("systemName", safe(entity.getSystemName()));
        values.put("systemNameMin", safe(entity.getSystemNameMin()));
        values.put("hardwareName", safe(entity.getHardwareName()));
        values.put("hardwareInfo", safe(entity.getHardwareInfo()));
        values.put("osName", safe(entity.getOsName()));
        values.put("osIp", safe(entity.getOsIp()));
        values.put("osInfo", safe(entity.getOsInfo()));
        values.put("serviceId", safe(entity.getServiceId()));
        return values;
    }

    private Map<String, String> toDSystemMap(DSystemExcelRow row) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("systemId", safe(row.systemId()));
        values.put("customerName", safe(row.customerName()));
        values.put("serviceName", safe(row.serviceName()));
        values.put("serviceNameMin", safe(row.serviceNameMin()));
        values.put("systemName", safe(row.systemName()));
        values.put("systemNameMin", safe(row.systemNameMin()));
        values.put("hardwareName", safe(row.hardwareName()));
        values.put("hardwareInfo", safe(row.hardwareInfo()));
        values.put("osName", safe(row.osName()));
        values.put("osIp", safe(row.osIp()));
        values.put("osInfo", safe(row.osInfo()));
        values.put("serviceId", safe(row.serviceId()));
        return values;
    }

    private Map<String, String> toDSystemAccountMap(DSystemAccount entity) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("id", safe(entity.getId()));
        values.put("systemId", safe(entity.getSystemId()));
        values.put("systemType", safe(entity.getSystemType()));
        values.put("accessType", safe(entity.getAccessType()));
        values.put("portNumber", safe(entity.getPortNumber()));
        values.put("accountId", safe(entity.getAccountId()));
        values.put("accountPw", safe(entity.getAccountPw()));
        return values;
    }

    private Map<String, String> toDSystemAccountMap(DSystemAccountExcelRow row) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("id", safe(row.id()));
        values.put("systemId", safe(row.systemId()));
        values.put("systemType", safe(row.systemType()));
        values.put("accessType", safe(row.accessType()));
        values.put("portNumber", safe(row.portNumber()));
        values.put("accountId", safe(row.accountId()));
        values.put("accountPw", safe(row.accountPw()));
        return values;
    }

    private String safe(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String nullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Long parseLong(String raw, String fieldName) {
        String value = nullable(raw);
        if (value == null) {
            return null;
        }
        try {
            if (value.contains(".")) {
                return (long) Double.parseDouble(value);
            }
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(fieldName + " 값이 숫자가 아닙니다: " + raw);
        }
    }

    private Integer parseInteger(String raw, String fieldName) {
        Long parsed = parseLong(raw, fieldName);
        return parsed == null ? null : Math.toIntExact(parsed);
    }

    private record DSystemExcelRow(
            Long systemId,
            String customerName,
            String serviceName,
            String serviceNameMin,
            String systemName,
            String systemNameMin,
            String hardwareName,
            String hardwareInfo,
            String osName,
            String osIp,
            String osInfo,
            Long serviceId
    ) {}

    private record DSystemAccountExcelRow(
            Integer id,
            Long systemId,
            String systemType,
            String accessType,
            String portNumber,
            String accountId,
            String accountPw
    ) {}

    private record ComparisonResult(
            BulkSyncSummaryDto summary,
            List<BulkSyncChangeItemDto> changes
    ) {}
}
