package com.example.backend.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.MailRequestDto;
import com.example.backend.dto.MailResponseDto;
import com.example.backend.entity.Info;
import com.example.backend.entity.Issue;
import com.example.backend.entity.ResourceStatus;
import com.example.backend.entity.ServiceHealthStatus;
import com.example.backend.entity.SystemCpuUsage;
import com.example.backend.entity.SystemDiskUsage;
import com.example.backend.entity.SystemMemUsage;
import com.example.backend.entity.SystemSecurityLog;
import com.example.backend.entity.SystemServiceLog;
import com.example.backend.entity.SystemStatus;
import com.example.backend.entity.SystemStatusOrigin;
import com.example.backend.repository.DSystemRepository;
import com.example.backend.repository.InfoRepository;
import com.example.backend.repository.IssueRepository;
import com.example.backend.repository.SystemCpuUsageRepository;
import com.example.backend.repository.SystemDiskUsageRepository;
import com.example.backend.repository.SystemMemUsageRepository;
import com.example.backend.repository.SystemSecurityLogRepository;
import com.example.backend.repository.SystemServiceLogRepository;
import com.example.backend.repository.SystemStatusRepository;
import com.example.backend.repository.SystemStatusOriginRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class MailQueueService {

    private static final Logger log = LoggerFactory.getLogger(MailQueueService.class);

    private static final int MAX_SYSTEM_ID_LENGTH = 100;
    private static final int MAX_BODY_LENGTH = 65535;
    private static final BigDecimal WARNING_THRESHOLD = BigDecimal.valueOf(80);
    private static final BigDecimal DANGER_THRESHOLD = BigDecimal.valueOf(95);
    private static final DateTimeFormatter FILE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss-SSS");
    private static final DateTimeFormatter INSPECTION_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter HTML_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String DEFAULT_DISK_NAME = "TOTAL";

    private static final Pattern INSPECTION_TIME_PATTERN =
            Pattern.compile("(?m)^\\s*점검\\s*일시\\s*:\\s*([0-9]{4}-[0-9]{2}-[0-9]{2}\\s+[0-9]{2}:[0-9]{2}:[0-9]{2})\\s*$");
    private static final Pattern CPU_USAGE_PATTERN =
            Pattern.compile("(?m)^\\s*-\\s*CPU\\s*사용률\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)%\\s*$");
    private static final Pattern MEMORY_PATTERN =
            Pattern.compile("(?m)^\\s*-\\s*메모리\\s*사용량\\s*:\\s*Total\\s*:\\s*(\\d+)MB\\s*,\\s*Used\\s*:\\s*(\\d+)MB\\s*,\\s*Available\\s*:\\s*(\\d+)MB\\s*\\(\\s*Usage\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)%\\s*\\)\\s*$");
    private static final Pattern DISK_USAGE_LINE_PATTERN =
            Pattern.compile("(?m)^\\s*-\\s*디스크\\s*사용률\\s*:\\s*(.+)\\s*$");
    private static final Pattern DISK_SINGLE_USAGE_PATTERN =
            Pattern.compile("^\\s*([0-9]+(?:\\.[0-9]+)?)%\\s*$");
    private static final Pattern DISK_MULTI_USAGE_PATTERN =
            Pattern.compile("^\\s*([^:,]+?)\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)%\\s*$");
    private static final Pattern POSTFIX_STATUS_PATTERN =
            Pattern.compile("(?m)^\\s*-\\s*Postfix\\s*\\(메일\\)\\s*:\\s*([A-Za-z]+)\\s*$");
    private static final Pattern NGINX_STATUS_PATTERN =
            Pattern.compile("(?m)^\\s*-\\s*Nginx\\s*\\(웹\\)\\s*:\\s*([A-Za-z]+)\\s*$");
    private static final Pattern POSTFIX_SUMMARY_PATTERN =
            Pattern.compile("(?s)\\[3\\]\\s*금일\\s*서비스\\s*로그\\s*요약\\s*\\(Postfix\\)\\s*(.*?)(?=\\n\\s*\\[4\\]\\s*금일\\s*서비스\\s*로그\\s*요약\\s*\\(Nginx\\)|\\z)");
    private static final Pattern NGINX_SUMMARY_PATTERN =
            Pattern.compile("(?s)\\[4\\]\\s*금일\\s*서비스\\s*로그\\s*요약\\s*\\(Nginx\\)\\s*(.*)$");
    private static final Pattern BARE_DASH_JSON_VALUE_PATTERN =
            Pattern.compile("(:\\s*)-(\\s*[,}\\]])");

    private final DSystemRepository dSystemRepository;
    private final InfoRepository infoRepository;
    private final IssueRepository issueRepository;
    private final SystemStatusOriginRepository systemStatusOriginRepository;
    private final SystemCpuUsageRepository systemCpuUsageRepository;
    private final SystemMemUsageRepository systemMemUsageRepository;
    private final SystemDiskUsageRepository systemDiskUsageRepository;
    private final SystemServiceLogRepository systemServiceLogRepository;
    private final SystemSecurityLogRepository systemSecurityLogRepository;
    private final SystemStatusRepository systemStatusRepository;
    private final ObjectMapper objectMapper;

    @Value("${mail.queue-dir:mail-queue}")
    private String queueDir;

    public MailQueueService(
            DSystemRepository dSystemRepository,
            InfoRepository infoRepository,
            IssueRepository issueRepository,
            SystemStatusOriginRepository systemStatusOriginRepository,
            SystemCpuUsageRepository systemCpuUsageRepository,
            SystemMemUsageRepository systemMemUsageRepository,
            SystemDiskUsageRepository systemDiskUsageRepository,
            SystemServiceLogRepository systemServiceLogRepository,
            SystemSecurityLogRepository systemSecurityLogRepository,
            SystemStatusRepository systemStatusRepository,
            ObjectMapper objectMapper
    ) {
        this.dSystemRepository = dSystemRepository;
        this.infoRepository = infoRepository;
        this.issueRepository = issueRepository;
        this.systemStatusOriginRepository = systemStatusOriginRepository;
        this.systemCpuUsageRepository = systemCpuUsageRepository;
        this.systemMemUsageRepository = systemMemUsageRepository;
        this.systemDiskUsageRepository = systemDiskUsageRepository;
        this.systemServiceLogRepository = systemServiceLogRepository;
        this.systemSecurityLogRepository = systemSecurityLogRepository;
        this.systemStatusRepository = systemStatusRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MailResponseDto enqueue(MailRequestDto request, String clientIp) {
        validate(request);

        String requestId = UUID.randomUUID().toString();
        LocalDateTime receivedAt = LocalDateTime.now();
        Integer dsystemId = parseDSystemId(request.getSystemId().trim());
        ensureDSystemExists(dsystemId.longValue());
        saveInfoAndIssues(request, receivedAt);

        ParsedInspectionData parsed = parseBodyOrNull(request.getBody(), requestId);
        SystemStatusOrigin origin = saveOrigin(request.getBody(), dsystemId, receivedAt);
        saveUsageRows(origin.getOriginId(), parsed);
        saveLogs(origin.getOriginId(), parsed, receivedAt);
        saveSystemStatus(origin.getOriginId(), parsed, receivedAt);

        try {
            writeQueueHtmlFile(requestId, request.getSystemId().trim(), receivedAt);
            return new MailResponseDto(requestId, "FILE_WRITTEN");
        } catch (IOException e) {
            throw new IllegalStateException("메일 큐 파일 저장에 실패했습니다.");
        }
    }

    private void saveInfoAndIssues(MailRequestDto request, LocalDateTime receivedAt) {
        JsonNode reportJson = readReportJsonOrNull(request.getBody());
        String bodyRawJson = reportJson == null
                ? createFallbackBodyJson(request, receivedAt)
                : writeJson(reportJson);

        Info info = new Info();
        info.setBodyRawJson(bodyRawJson);
        info.setTime(receivedAt);
        infoRepository.save(info);

        if (reportJson != null) {
            saveIssues(reportJson);
        }
    }

    private void saveIssues(JsonNode reportJson) {
        JsonNode issues = getIssueArray(reportJson);
        if (issues == null || !issues.isArray()) {
            return;
        }

        List<Issue> issueRows = new ArrayList<>();
        for (JsonNode item : issues) {
            Issue issue = new Issue();
            issue.setType(readText(item, "type", readText(item, "category", "UNKNOWN")));
            issue.setValue(readText(item, "value", readText(item, "level", "UNKNOWN")));
            issue.setDetail(readIssueDetail(item));
            issueRows.add(issue);
        }

        if (!issueRows.isEmpty()) {
            issueRepository.saveAll(issueRows);
        }
    }

    private JsonNode getIssueArray(JsonNode reportJson) {
        JsonNode issues = reportJson.get("issues");
        if (issues != null && issues.isArray()) {
            return issues;
        }
        JsonNode healthFlags = reportJson.get("health_flags");
        if (healthFlags != null && healthFlags.isArray()) {
            return healthFlags;
        }
        return null;
    }

    private String readIssueDetail(JsonNode item) {
        String detail = readText(item, "detail", readText(item, "message", ""));
        String target = readText(item, "target", "");
        if (target == null || target.isBlank()) {
            return detail;
        }
        if (detail == null || detail.isBlank()) {
            return "target=" + target;
        }
        return "target=" + target + " | " + detail;
    }

    private String readText(JsonNode node, String fieldName, String defaultValue) {
        if (node == null || node.isNull()) {
            return defaultValue;
        }
        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull()) {
            return defaultValue;
        }
        return value.asString();
    }

    private JsonNode readReportJsonOrNull(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(body);
        } catch (Exception e) {
            String repairedBody = repairCollectorJson(body);
            if (repairedBody.equals(body)) {
                return null;
            }
            try {
                return objectMapper.readTree(repairedBody);
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private String repairCollectorJson(String body) {
        return BARE_DASH_JSON_VALUE_PATTERN.matcher(body).replaceAll("$1null$2");
    }

    private String createFallbackBodyJson(MailRequestDto request, LocalDateTime receivedAt) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "system_id", request.getSystemId(),
                    "received_at", HTML_TIME_FORMAT.format(receivedAt),
                    "body", request.getBody()
            ));
        } catch (Exception e) {
            throw new IllegalStateException("info 원본 JSON 생성에 실패했습니다.");
        }
    }

    private String writeJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            throw new IllegalStateException("info 원본 JSON 저장에 실패했습니다.");
        }
    }

    private void validate(MailRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("요청 본문이 필요합니다.");
        }
        if (request.getSystemId() == null || request.getSystemId().isBlank()) {
            throw new IllegalArgumentException("system_id는 필수입니다.");
        }
        if (request.getBody() == null || request.getBody().isBlank()) {
            throw new IllegalArgumentException("body는 필수입니다.");
        }
        if (request.getSystemId().trim().length() > MAX_SYSTEM_ID_LENGTH) {
            throw new IllegalArgumentException("system_id는 100자 이하여야 합니다.");
        }
        if (request.getBody().length() > MAX_BODY_LENGTH) {
            throw new IllegalArgumentException("body는 65535자 이하여야 합니다.");
        }
        if (parseSystemId(request.getSystemId().trim()).isEmpty()) {
            throw new IllegalArgumentException("system_id는 숫자여야 합니다.");
        }
    }

    private Path writeQueueHtmlFile(
            String requestId,
            String systemId,
            LocalDateTime generatedAt
    ) throws IOException {
        Path resolvedQueueDir = resolveQueueDirectory();
        Files.createDirectories(resolvedQueueDir);

        OffsetDateTime nowUtc = OffsetDateTime.now(ZoneOffset.UTC);
        String safeSystemId = sanitizeSystemId(systemId);
        String fileName = FILE_TIME_FORMAT.format(nowUtc) + "-" + safeSystemId + "-" + requestId + ".html";
        Path filePath = resolvedQueueDir.resolve(fileName);

        List<SystemStatusRepository.QueueStatusRow> rows = systemStatusRepository.findLatestQueueStatusRows();
        String html = buildHtmlPayload(rows, generatedAt);
        Files.writeString(filePath, html, StandardCharsets.UTF_8);
        return filePath;
    }

    private Path resolveQueueDirectory() {
        Path dirPath = Path.of(queueDir);
        if (dirPath.isAbsolute()) {
            return dirPath.normalize();
        }
        return Path.of(System.getProperty("user.dir")).resolve(dirPath).normalize();
    }

    private String buildHtmlPayload(List<SystemStatusRepository.QueueStatusRow> rows, LocalDateTime generatedAt) {
        StringBuilder tbody = new StringBuilder();
        if (rows == null || rows.isEmpty()) {
            tbody.append("""
                    <tr>
                      <td colspan="4">데이터가 없습니다.</td>
                    </tr>
                    """);
        } else {
            int index = 1;
            for (SystemStatusRepository.QueueStatusRow row : rows) {
                String customerName = escapeHtml(row.getCustomerName());
                String systemName = escapeHtml(row.getSystemName());
                boolean isSafe = "SAFE".equalsIgnoreCase(row.getTotalStatus());
                String statusText = isSafe ? "정상" : "비정상";
                String statusClass = isSafe ? "ok" : "ng";

                tbody.append("      <tr>\n")
                        .append("        <td>").append(index++).append("</td>\n")
                        .append("        <td class=\"left\">").append(customerName).append("</td>\n")
                        .append("        <td class=\"left\">").append(systemName).append("</td>\n")
                        .append("        <td class=\"").append(statusClass).append("\">").append(statusText).append("</td>\n")
                        .append("      </tr>\n");
            }
        }

        return """
                <!doctype html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <title>점검 상태 보고서</title>
                  <style>
                    body {
                      font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
                      margin: 24px;
                      color: #222;
                      background: #fff;
                    }
                    h1 {
                      margin: 0 0 8px;
                      font-size: 22px;
                    }
                    .meta {
                      margin-bottom: 16px;
                      color: #666;
                      font-size: 13px;
                    }
                    table {
                      width: 100%%;
                      border-collapse: collapse;
                      table-layout: fixed;
                    }
                    th, td {
                      border: 1px solid #d9d9d9;
                      padding: 10px 8px;
                      text-align: center;
                      font-size: 14px;
                      word-break: keep-all;
                    }
                    th {
                      background: #f5f7fa;
                      font-weight: 700;
                    }
                    td.left {
                      text-align: left;
                    }
                    .ok {
                      color: #137333;
                      font-weight: 700;
                    }
                    .ng {
                      color: #b42318;
                      font-weight: 700;
                    }
                  </style>
                </head>
                <body>
                  <h1>시스템 점검 상태</h1>
                  <div class="meta">생성시각: %s</div>
                
                  <table>
                    <thead>
                      <tr>
                        <th style="width:70px;">번호</th>
                        <th>고객명</th>
                        <th>시스템명</th>
                        <th style="width:120px;">점검 상태</th>
                      </tr>
                    </thead>
                    <tbody>
                %s    </tbody>
                  </table>
                </body>
                </html>
                """.formatted(HTML_TIME_FORMAT.format(generatedAt), tbody.toString());
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String sanitizeSystemId(String systemId) {
        String safe = systemId.replaceAll("[^a-zA-Z0-9_-]", "_");
        return safe.isBlank() ? "unknown" : safe;
    }

    private String trimErrorMessage(String message) {
        if (message == null || message.isBlank()) {
            return "unknown error";
        }
        if (message.length() <= 1000) {
            return message;
        }
        return message.substring(0, 1000);
    }

    private ParsedInspectionData parseBodyOrNull(String body, String requestId) {
        try {
            return parseInspectionBody(body);
        } catch (IllegalArgumentException e) {
            log.warn("메일 보고서 파싱 실패(requestId={}): {}", requestId, e.getMessage());
            return new ParsedInspectionData(
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    trimErrorMessage(e.getMessage())
            );
        }
    }

    private SystemStatusOrigin saveOrigin(String bodyRaw, Integer dsystemId, LocalDateTime receivedAt) {
        SystemStatusOrigin origin = new SystemStatusOrigin();
        origin.setBodyRaw(bodyRaw);
        origin.setDsystemId(dsystemId);
        origin.setTime(receivedAt);
        try {
            return systemStatusOriginRepository.save(origin);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("system_status_origin 저장에 실패했습니다. dsystem_id foreign key를 확인하세요.");
        }
    }

    private void saveUsageRows(Integer originId, ParsedInspectionData parsed) {
        float cpuUsage = asFloat(parsed.cpuUsage());
        float memUsage = asFloat(parsed.memUsage());

        SystemCpuUsage cpu = new SystemCpuUsage();
        cpu.setOriginId(originId);
        cpu.setCpuUsage(cpuUsage);
        systemCpuUsageRepository.save(cpu);

        SystemMemUsage mem = new SystemMemUsage();
        mem.setOriginId(originId);
        mem.setMemUsage(memUsage);
        systemMemUsageRepository.save(mem);

        for (DiskUsageItem diskUsageItem : resolveDiskUsagesForSave(parsed.diskUsages())) {
            SystemDiskUsage disk = new SystemDiskUsage();
            disk.setOriginId(originId);
            disk.setDiskName(diskUsageItem.diskName());
            disk.setDiskUsage(asFloat(diskUsageItem.usage()));
            systemDiskUsageRepository.save(disk);
        }
    }

    private void saveLogs(Integer originId, ParsedInspectionData parsed, LocalDateTime receivedAt) {
        if (parsed.parseError() != null && !parsed.parseError().isBlank()) {
            SystemServiceLog parseErrorLog = new SystemServiceLog();
            parseErrorLog.setOriginId(originId);
            parseErrorLog.setServiceName("parser");
            parseErrorLog.setServiceStatus("failed");
            parseErrorLog.setLogDetail("PARSE_FAILED: " + parsed.parseError());
            parseErrorLog.setTime(receivedAt);
            systemServiceLogRepository.save(parseErrorLog);
        }

        saveServiceLog(originId, "postfix", parsed.postfixStatus(), parsed.postfixLogSummary(), receivedAt);
        saveServiceLog(originId, "nginx", parsed.nginxStatus(), parsed.nginxLogSummary(), receivedAt);

        SystemSecurityLog securityLog = new SystemSecurityLog();
        securityLog.setOriginId(originId);
        securityLog.setLogDetail("SECURITY_STATUS=SAFE (no security parser input)");
        securityLog.setTime(receivedAt);
        systemSecurityLogRepository.save(securityLog);
    }

    private void saveServiceLog(
            Integer originId,
            String serviceName,
            String serviceStatus,
            String logDetail,
            LocalDateTime receivedAt
    ) {
        SystemServiceLog serviceLog = new SystemServiceLog();
        serviceLog.setOriginId(originId);
        serviceLog.setServiceName(serviceName);
        serviceLog.setServiceStatus(normalizeServiceStatus(serviceStatus));
        serviceLog.setLogDetail(normalizeServiceLogDetail(logDetail));
        serviceLog.setTime(receivedAt);
        systemServiceLogRepository.save(serviceLog);
    }

    private void saveSystemStatus(Integer originId, ParsedInspectionData parsed, LocalDateTime receivedAt) {
        BigDecimal maxDiskUsage = findMaxDiskUsage(parsed.diskUsages());

        SystemStatus systemStatus = new SystemStatus();
        systemStatus.setOriginId(originId);
        systemStatus.setMemStatus(calculateResourceStatus(parsed.memUsage()));
        systemStatus.setDiskStatus(calculateResourceStatus(maxDiskUsage));
        systemStatus.setServiceStatus(calculateServiceStatus(parsed.postfixStatus(), parsed.nginxStatus()));
        systemStatus.setSecurityStatus(ServiceHealthStatus.SAFE);
        systemStatus.setTotalStatus(calculateTotalStatus(
                systemStatus.getMemStatus(),
                systemStatus.getDiskStatus(),
                systemStatus.getServiceStatus(),
                systemStatus.getSecurityStatus()));
        systemStatus.setTime(parsed.inspectionTime() != null ? parsed.inspectionTime() : receivedAt);

        try {
            systemStatusRepository.save(systemStatus);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("system_status 저장에 실패했습니다. origin_id foreign key를 확인하세요.");
        } catch (RuntimeException e) {
            log.error("system_status 저장 중 오류(originId={}): {}", originId, e.getMessage());
            throw e;
        }
    }

    private ResourceStatus calculateResourceStatus(BigDecimal usagePercent) {
        if (usagePercent == null) {
            return ResourceStatus.WARNING;
        }
        if (usagePercent.compareTo(DANGER_THRESHOLD) >= 0) {
            return ResourceStatus.DANGER;
        }
        if (usagePercent.compareTo(WARNING_THRESHOLD) >= 0) {
            return ResourceStatus.WARNING;
        }
        return ResourceStatus.SAFE;
    }

    private ServiceHealthStatus calculateServiceStatus(String postfixStatus, String nginxStatus) {
        if (isHealthyService(postfixStatus) && isHealthyService(nginxStatus)) {
            return ServiceHealthStatus.SAFE;
        }
        return ServiceHealthStatus.DANGER;
    }

    private ServiceHealthStatus calculateTotalStatus(
            ResourceStatus memStatus,
            ResourceStatus diskStatus,
            ServiceHealthStatus serviceStatus,
            ServiceHealthStatus securityStatus) {
        if (memStatus == ResourceStatus.SAFE
                && diskStatus == ResourceStatus.SAFE
                && serviceStatus == ServiceHealthStatus.SAFE
                && securityStatus == ServiceHealthStatus.SAFE) {
            return ServiceHealthStatus.SAFE;
        }
        return ServiceHealthStatus.DANGER;
    }

    private boolean isHealthyService(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String normalized = value.trim().toUpperCase();
        return normalized.equals("OK")
                || normalized.equals("ACTIVE")
                || normalized.equals("RUNNING")
                || normalized.equals("UP")
                || normalized.equals("NORMAL")
                || normalized.equals("SAFE");
    }

    private void ensureDSystemExists(Long systemId) {
        if (!dSystemRepository.existsById(systemId)) {
            throw new IllegalStateException("존재하지 않는 system_id입니다: " + systemId);
        }
    }

    private Integer parseDSystemId(String value) {
        Long parsed = parseSystemId(value)
                .orElseThrow(() -> new IllegalArgumentException("system_id는 숫자여야 합니다."));
        try {
            return Math.toIntExact(parsed);
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException("system_id가 허용 범위를 초과했습니다.");
        }
    }

    private float asFloat(BigDecimal value) {
        if (value == null) {
            return 0.0f;
        }
        return value.floatValue();
    }

    private String normalizeServiceStatus(String status) {
        if (status == null || status.isBlank()) {
            return "unknown";
        }
        return status.trim().toLowerCase();
    }

    private String normalizeServiceLogDetail(String detail) {
        if (detail == null || detail.isBlank()) {
            return "(no summary)";
        }
        return detail.trim();
    }

    private List<DiskUsageItem> resolveDiskUsagesForSave(List<DiskUsageItem> diskUsages) {
        if (diskUsages == null || diskUsages.isEmpty()) {
            return List.of(new DiskUsageItem(DEFAULT_DISK_NAME, BigDecimal.ZERO));
        }
        return diskUsages;
    }

    private BigDecimal findMaxDiskUsage(List<DiskUsageItem> diskUsages) {
        if (diskUsages == null || diskUsages.isEmpty()) {
            return null;
        }
        BigDecimal max = null;
        for (DiskUsageItem item : diskUsages) {
            if (item == null || item.usage() == null) {
                continue;
            }
            if (max == null || item.usage().compareTo(max) > 0) {
                max = item.usage();
            }
        }
        return max;
    }

    private ParsedInspectionData parseInspectionBody(String bodyRaw) {
        if (bodyRaw == null || bodyRaw.isBlank()) {
            throw new IllegalArgumentException("body_raw is empty");
        }
        JsonNode reportJson = readReportJsonOrNull(bodyRaw);
        if (reportJson != null && reportJson.isObject()) {
            return parseInspectionJson(reportJson);
        }

        LocalDateTime inspectionTime = extractRequired(INSPECTION_TIME_PATTERN, bodyRaw, 1, "inspection_time")
                .flatMap(this::toLocalDateTime)
                .orElseThrow(() -> new IllegalArgumentException("inspection_time format is invalid"));

        BigDecimal cpuUsage = extractOptional(CPU_USAGE_PATTERN, bodyRaw, 1)
                .flatMap(this::toBigDecimal)
                .orElse(null);

        Integer memTotal = null;
        Integer memUsed = null;
        Integer memAvailable = null;
        BigDecimal memUsage = null;

        Matcher memoryMatcher = MEMORY_PATTERN.matcher(bodyRaw);
        if (memoryMatcher.find()) {
            memTotal = toInteger(memoryMatcher.group(1)).orElse(null);
            memUsed = toInteger(memoryMatcher.group(2)).orElse(null);
            memAvailable = toInteger(memoryMatcher.group(3)).orElse(null);
            memUsage = toBigDecimal(memoryMatcher.group(4)).orElse(null);
        }

        List<DiskUsageItem> diskUsages = parseDiskUsages(bodyRaw);

        String postfixStatus = extractOptional(POSTFIX_STATUS_PATTERN, bodyRaw, 1)
                .orElse(null);

        String nginxStatus = extractOptional(NGINX_STATUS_PATTERN, bodyRaw, 1)
                .orElse(null);

        String postfixLogSummary = extractOptional(POSTFIX_SUMMARY_PATTERN, bodyRaw, 1)
                .orElse(null);

        String nginxLogSummary = extractOptional(NGINX_SUMMARY_PATTERN, bodyRaw, 1)
                .orElse(null);

        return new ParsedInspectionData(
                inspectionTime,
                cpuUsage,
                memTotal,
                memUsed,
                memAvailable,
                memUsage,
                diskUsages,
                postfixStatus,
                nginxStatus,
                postfixLogSummary,
                nginxLogSummary,
                null
        );
    }

    private ParsedInspectionData parseInspectionJson(JsonNode reportJson) {
        LocalDateTime inspectionTime = firstDateTime(
                readText(reportJson, "generatedAt", null),
                readText(reportJson, "generated_at", null),
                readText(reportJson.path("period"), "to", null)
        ).orElse(LocalDateTime.now());

        BigDecimal cpuUsage = firstBigDecimal(
                at(reportJson, "summary", "cpu", "usageAvgPct"),
                at(reportJson, "summary", "cpu", "usage_avg_pct"),
                at(reportJson, "summary", "cpu", "usagePeakPct"),
                at(reportJson, "summary", "cpu", "usage_peak_pct")
        ).orElse(null);

        BigDecimal memUsage = firstBigDecimal(
                at(reportJson, "summary", "memory", "usedAvgPct"),
                at(reportJson, "summary", "memory", "used_effective_avg_pct"),
                at(reportJson, "summary", "memory", "usedPeakPct"),
                at(reportJson, "summary", "memory", "used_effective_peak_pct")
        ).orElse(null);

        Integer memAvailable = firstBigDecimal(
                at(reportJson, "summary", "memory", "availableMinMb"),
                at(reportJson, "summary", "memory", "available_min_mb")
        ).map(BigDecimal::intValue).orElse(null);

        List<DiskUsageItem> diskUsages = parseDiskUsagesFromJson(reportJson);

        return new ParsedInspectionData(
                inspectionTime,
                cpuUsage,
                null,
                null,
                memAvailable,
                memUsage,
                diskUsages,
                "SAFE",
                "SAFE",
                null,
                null,
                null
        );
    }

    private List<DiskUsageItem> parseDiskUsagesFromJson(JsonNode reportJson) {
        JsonNode filesystems = reportJson.get("filesystems");
        if (filesystems == null || !filesystems.isArray()) {
            filesystems = reportJson.path("snapshots").get("filesystems");
        }
        if (filesystems == null || !filesystems.isArray()) {
            return Collections.emptyList();
        }

        List<DiskUsageItem> diskUsages = new ArrayList<>();
        for (JsonNode item : filesystems) {
            BigDecimal usedPct = firstBigDecimal(
                    item.get("usedPct"),
                    item.get("used_pct")
            ).orElse(null);
            if (usedPct == null) {
                continue;
            }

            String diskName = readText(item, "mount", readText(item, "device", DEFAULT_DISK_NAME));
            diskUsages.add(new DiskUsageItem(diskName, usedPct));
        }
        return diskUsages;
    }

    private List<DiskUsageItem> parseDiskUsages(String bodyRaw) {
        Optional<String> diskLine = extractOptional(DISK_USAGE_LINE_PATTERN, bodyRaw, 1);
        if (diskLine.isEmpty()) {
            return Collections.emptyList();
        }

        String raw = diskLine.get().trim();
        Matcher single = DISK_SINGLE_USAGE_PATTERN.matcher(raw);
        if (single.matches()) {
            return List.of(new DiskUsageItem(DEFAULT_DISK_NAME, toBigDecimal(single.group(1)).orElse(BigDecimal.ZERO)));
        }

        String[] segments = raw.split(",");
        List<DiskUsageItem> diskUsages = new ArrayList<>();

        for (String segment : segments) {
            Matcher multi = DISK_MULTI_USAGE_PATTERN.matcher(segment.trim());
            if (!multi.matches()) {
                continue;
            }
            String diskName = normalizeDiskName(multi.group(1));
            BigDecimal usage = toBigDecimal(multi.group(2)).orElse(null);
            if (usage != null) {
                diskUsages.add(new DiskUsageItem(diskName, usage));
            }
        }

        if (diskUsages.isEmpty()) {
            throw new IllegalArgumentException("disk_usage format is invalid");
        }
        return diskUsages;
    }

    private String normalizeDiskName(String rawName) {
        String name = rawName == null ? "" : rawName.trim();
        if (name.matches("^[A-Za-z]$")) {
            return name.toUpperCase() + ":";
        }
        return name;
    }

    private Optional<String> extractRequired(Pattern pattern, String text, int group, String fieldName) {
        Optional<String> value = extractOptional(pattern, text, group);
        if (value.isEmpty()) {
            throw new IllegalArgumentException(fieldName + " not found");
        }
        return value;
    }

    private Optional<String> extractOptional(Pattern pattern, String text, int group) {
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) {
            return Optional.empty();
        }
        String value = matcher.group(group);
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(value.trim());
    }

    private Optional<LocalDateTime> toLocalDateTime(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(LocalDateTime.parse(value, INSPECTION_TIME_FORMAT));
        } catch (DateTimeParseException e) {
            try {
                return Optional.of(OffsetDateTime.parse(value).toLocalDateTime());
            } catch (DateTimeParseException ignored) {
                try {
                    return Optional.of(LocalDateTime.parse(value));
                } catch (DateTimeParseException ignoredAgain) {
                    return Optional.empty();
                }
            }
        }
    }

    private Optional<LocalDateTime> firstDateTime(String... values) {
        if (values == null) {
            return Optional.empty();
        }
        for (String value : values) {
            Optional<LocalDateTime> parsed = toLocalDateTime(value);
            if (parsed.isPresent()) {
                return parsed;
            }
        }
        return Optional.empty();
    }

    private Optional<BigDecimal> toBigDecimal(String value) {
        try {
            return Optional.of(new BigDecimal(value.trim()));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private Optional<BigDecimal> firstBigDecimal(JsonNode... values) {
        if (values == null) {
            return Optional.empty();
        }
        for (JsonNode value : values) {
            if (value == null || value.isMissingNode() || value.isNull()) {
                continue;
            }
            Optional<BigDecimal> parsed = toBigDecimal(value.asString());
            if (parsed.isPresent()) {
                return parsed;
            }
        }
        return Optional.empty();
    }

    private JsonNode at(JsonNode node, String... path) {
        JsonNode current = node;
        for (String segment : path) {
            if (current == null || current.isMissingNode() || current.isNull()) {
                return null;
            }
            current = current.get(segment);
        }
        return current;
    }

    private Optional<Integer> toInteger(String value) {
        try {
            return Optional.of(Integer.parseInt(value.trim()));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private Optional<Long> parseSystemId(String value) {
        if (value == null || value.isBlank() || !value.matches("\\d+")) {
            return Optional.empty();
        }
        try {
            return Optional.of(Long.parseLong(value));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private record ParsedInspectionData(
            LocalDateTime inspectionTime,
            BigDecimal cpuUsage,
            Integer memTotal,
            Integer memUsed,
            Integer memAvailable,
            BigDecimal memUsage,
            List<DiskUsageItem> diskUsages,
            String postfixStatus,
            String nginxStatus,
            String postfixLogSummary,
            String nginxLogSummary,
            String parseError
    ) {
    }

    private record DiskUsageItem(
            String diskName,
            BigDecimal usage
    ) {
    }

}
