package com.example.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.MailRequestDto;
import com.example.backend.dto.MailResponseDto;
import com.example.backend.entity.DSystem;
import com.example.backend.entity.Info;
import com.example.backend.entity.Issue;
import com.example.backend.repository.DSystemRepository;
import com.example.backend.repository.InfoRepository;
import com.example.backend.repository.IssueRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class MailQueueService {

    private static final int MAX_SYSTEM_ID_LENGTH = 100;
    private static final int MAX_BODY_LENGTH = 65535;
    private static final DateTimeFormatter FILE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss-SSS");
    private static final DateTimeFormatter HTML_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Pattern BARE_DASH_JSON_VALUE_PATTERN =
            Pattern.compile("(:\\s*)-(\\s*[,}\\]])");

    private final DSystemRepository dSystemRepository;
    private final InfoRepository infoRepository;
    private final IssueRepository issueRepository;
    private final ObjectMapper objectMapper;

    @Value("${mail.queue-dir:mail-queue}")
    private String queueDir;

    public MailQueueService(
            DSystemRepository dSystemRepository,
            InfoRepository infoRepository,
            IssueRepository issueRepository,
            ObjectMapper objectMapper
    ) {
        this.dSystemRepository = dSystemRepository;
        this.infoRepository = infoRepository;
        this.issueRepository = issueRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MailResponseDto enqueue(MailRequestDto request, String clientIp) {
        validate(request);

        String requestId = UUID.randomUUID().toString();
        LocalDateTime receivedAt = LocalDateTime.now();
        String systemIdText = request.getSystemId().trim();
        Long dsystemId = parseDSystemId(systemIdText);
        DSystem dSystem = findDSystemOrThrow(dsystemId);

        SavedReport savedReport = saveInfoAndIssues(request, receivedAt);

        try {
            writeQueueHtmlFile(
                    requestId,
                    systemIdText,
                    receivedAt,
                    dSystem,
                    isReportSafe(savedReport.reportJson())
            );
            return new MailResponseDto(requestId, "FILE_WRITTEN");
        } catch (IOException e) {
            throw new IllegalStateException("메일 큐 파일 저장에 실패했습니다.");
        }
    }

    private SavedReport saveInfoAndIssues(MailRequestDto request, LocalDateTime receivedAt) {
        JsonNode reportJson = readReportJsonOrNull(request.getBody());
        String bodyRawJson = reportJson == null
                ? createFallbackBodyJson(request, receivedAt)
                : writeJson(reportJson);

        Info info = new Info();
        info.setBodyRawJson(bodyRawJson);
        info.setTime(receivedAt);
        Info savedInfo = infoRepository.save(info);

        if (reportJson != null) {
            saveIssues(reportJson, savedInfo.getId());
        }

        return new SavedReport(reportJson, savedInfo);
    }

    private void saveIssues(JsonNode reportJson, Long infoId) {
        JsonNode issues = getIssueArray(reportJson);
        if (issues == null || !issues.isArray()) {
            return;
        }

        for (JsonNode item : issues) {
            Issue issue = new Issue();
            issue.setInfoId(infoId);
            issue.setType(readText(item, "type", readText(item, "category", "UNKNOWN")));
            issue.setValue(readText(item, "value", readText(item, "level", "UNKNOWN")));
            issue.setDetail(readIssueDetail(item));
            issueRepository.save(issue);
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

    private boolean isReportSafe(JsonNode reportJson) {
        if (reportJson == null) {
            return true;
        }
        JsonNode issues = getIssueArray(reportJson);
        if (issues == null || !issues.isArray()) {
            return true;
        }
        for (JsonNode item : issues) {
            String level = readText(item, "level", readText(item, "value", ""));
            if (level == null || level.isBlank()) {
                return false;
            }
            String normalized = level.trim().toUpperCase();
            if (!normalized.equals("INFO")) {
                return false;
            }
        }
        return true;
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
            LocalDateTime generatedAt,
            DSystem dSystem,
            boolean isSafe
    ) throws IOException {
        Path resolvedQueueDir = resolveQueueDirectory();
        Files.createDirectories(resolvedQueueDir);

        OffsetDateTime nowUtc = OffsetDateTime.now(ZoneOffset.UTC);
        String safeSystemId = sanitizeSystemId(systemId);
        String fileName = FILE_TIME_FORMAT.format(nowUtc) + "-" + safeSystemId + "-" + requestId + ".html";
        Path filePath = resolvedQueueDir.resolve(fileName);

        String html = buildHtmlPayload(dSystem, isSafe, generatedAt);
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

    private String buildHtmlPayload(DSystem dSystem, boolean isSafe, LocalDateTime generatedAt) {
        String customerName = escapeHtml(dSystem.getCustomerName());
        String systemName = escapeHtml(dSystem.getSystemNameMin());
        if (systemName.isBlank()) {
            systemName = escapeHtml(dSystem.getSystemName());
        }
        String statusText = isSafe ? "정상" : "비정상";
        String statusClass = isSafe ? "ok" : "ng";

        String tbody = """
                    <tr>
                      <td>1</td>
                      <td class="left">%s</td>
                      <td class="left">%s</td>
                      <td class="%s">%s</td>
                    </tr>
                """.formatted(customerName, systemName, statusClass, statusText);

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
                """.formatted(HTML_TIME_FORMAT.format(generatedAt), tbody);
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

    private DSystem findDSystemOrThrow(Long systemId) {
        return dSystemRepository.findById(systemId)
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 system_id입니다: " + systemId));
    }

    private Long parseDSystemId(String value) {
        return parseSystemId(value)
                .orElseThrow(() -> new IllegalArgumentException("system_id는 숫자여야 합니다."));
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

    private record SavedReport(
            JsonNode reportJson,
            Info info
    ) {
    }
}
