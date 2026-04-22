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
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.example.backend.dto.MailRequestDto;
import com.example.backend.dto.MailResponseDto;
import com.example.backend.entity.MailQueueRequest;
import com.example.backend.entity.MailReport;
import com.example.backend.repository.MailReportRepository;
import com.example.backend.repository.MailQueueRequestRepository;

@Service
public class MailQueueService {

    private static final Logger log = LoggerFactory.getLogger(MailQueueService.class);

    private static final int MAX_SYSTEM_ID_LENGTH = 100;
    private static final int MAX_BODY_LENGTH = 65535;
    private static final DateTimeFormatter FILE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss-SSS");
    private static final DateTimeFormatter INSPECTION_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final Pattern INSPECTION_TIME_PATTERN =
            Pattern.compile("(?m)^\\s*점검\\s*일시\\s*:\\s*([0-9]{4}-[0-9]{2}-[0-9]{2}\\s+[0-9]{2}:[0-9]{2}:[0-9]{2})\\s*$");
    private static final Pattern CPU_USAGE_PATTERN =
            Pattern.compile("(?m)^\\s*-\\s*CPU\\s*사용률\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)%\\s*$");
    private static final Pattern MEMORY_PATTERN =
            Pattern.compile("(?m)^\\s*-\\s*메모리\\s*사용량\\s*:\\s*Total\\s*:\\s*(\\d+)MB\\s*,\\s*Used\\s*:\\s*(\\d+)MB\\s*,\\s*Available\\s*:\\s*(\\d+)MB\\s*\\(\\s*Usage\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)%\\s*\\)\\s*$");
    private static final Pattern DISK_USAGE_PATTERN =
            Pattern.compile("(?m)^\\s*-\\s*디스크\\s*사용률\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)%\\s*$");
    private static final Pattern POSTFIX_STATUS_PATTERN =
            Pattern.compile("(?m)^\\s*-\\s*Postfix\\s*\\(메일\\)\\s*:\\s*([A-Za-z]+)\\s*$");
    private static final Pattern NGINX_STATUS_PATTERN =
            Pattern.compile("(?m)^\\s*-\\s*Nginx\\s*\\(웹\\)\\s*:\\s*([A-Za-z]+)\\s*$");

    private final MailQueueRequestRepository mailQueueRequestRepository;
    private final MailReportRepository mailReportRepository;

    @Value("${mail.queue-dir:mail-queue}")
    private String queueDir;

    public MailQueueService(
            MailQueueRequestRepository mailQueueRequestRepository,
            MailReportRepository mailReportRepository
    ) {
        this.mailQueueRequestRepository = mailQueueRequestRepository;
        this.mailReportRepository = mailReportRepository;
    }

    public MailResponseDto enqueue(MailRequestDto request, String clientIp) {
        validate(request);

        String requestId = UUID.randomUUID().toString();
        MailQueueRequest mailQueueRequest = new MailQueueRequest();
        mailQueueRequest.setRequestId(requestId);
        mailQueueRequest.setSystemId(request.getSystemId().trim());
        mailQueueRequest.setBodyRaw(request.getBody());
        mailQueueRequest.setStatus("RECEIVED");
        mailQueueRequestRepository.save(mailQueueRequest);
        saveMailReport(mailQueueRequest, request);

        try {
            Path queueFilePath = writeQueueFile(requestId, mailQueueRequest.getSystemId(), request.getBody(), clientIp);
            mailQueueRequest.setStatus("FILE_WRITTEN");
            mailQueueRequest.setFilePath(queueFilePath.toString());
            mailQueueRequest.setErrorMessage(null);
            mailQueueRequestRepository.save(mailQueueRequest);
            return new MailResponseDto(requestId, "FILE_WRITTEN");
        } catch (IOException e) {
            mailQueueRequest.setStatus("FAILED");
            mailQueueRequest.setErrorMessage(trimErrorMessage(e.getMessage()));
            mailQueueRequestRepository.save(mailQueueRequest);
            throw new IllegalStateException("메일 큐 파일 저장에 실패했습니다.");
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

    private Path writeQueueFile(String requestId, String systemId, String body, String clientIp) throws IOException {
        Path resolvedQueueDir = resolveQueueDirectory();
        Files.createDirectories(resolvedQueueDir);

        OffsetDateTime nowUtc = OffsetDateTime.now(ZoneOffset.UTC);
        String safeSystemId = sanitizeSystemId(systemId);
        String fileName = FILE_TIME_FORMAT.format(nowUtc) + "-" + safeSystemId + "-" + requestId + ".txt";
        Path filePath = resolvedQueueDir.resolve(fileName);

        String text = buildTextPayload(requestId, systemId, body, clientIp, nowUtc);
        Files.writeString(filePath, text, StandardCharsets.UTF_8);
        return filePath;
    }

    private Path resolveQueueDirectory() {
        Path dirPath = Path.of(queueDir);
        if (dirPath.isAbsolute()) {
            return dirPath.normalize();
        }
        return Path.of(System.getProperty("user.dir")).resolve(dirPath).normalize();
    }

    private String buildTextPayload(String requestId, String systemId, String body, String clientIp, OffsetDateTime nowUtc) {
        String resolvedClientIp = (clientIp == null || clientIp.isBlank()) ? "unknown" : clientIp;
        return "request_id: " + requestId + System.lineSeparator()
                + "system_id: " + systemId + System.lineSeparator()
                + "received_at: " + nowUtc + System.lineSeparator()
                + "client_ip: " + resolvedClientIp + System.lineSeparator()
                + System.lineSeparator()
                + "[body]" + System.lineSeparator()
                + body
                + System.lineSeparator();
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

    private void saveMailReport(MailQueueRequest mailQueueRequest, MailRequestDto request) {
        MailReport report = new MailReport();
        report.setRequestId(mailQueueRequest.getId());
        Long systemId = parseSystemId(request.getSystemId().trim())
                .orElseThrow(() -> new IllegalArgumentException("system_id는 숫자여야 합니다."));
        report.setSystemId(systemId);

        try {
            ParsedInspectionData parsed = parseInspectionBody(request.getBody());
            report.setInspectionTime(parsed.inspectionTime());
            report.setCpuUsage(parsed.cpuUsage());
            report.setMemTotal(parsed.memTotal());
            report.setMemUsed(parsed.memUsed());
            report.setMemAvailable(parsed.memAvailable());
            report.setMemUsage(parsed.memUsage());
            report.setDiskUsage(parsed.diskUsage());
            report.setPostfixStatus(parsed.postfixStatus());
            report.setNginxStatus(parsed.nginxStatus());
            report.setParseStatus("PARSED");
            report.setParseError(null);
        } catch (IllegalArgumentException e) {
            report.setParseStatus("PARSE_FAILED");
            report.setParseError(trimErrorMessage(e.getMessage()));
            log.warn("메일 보고서 파싱 실패(requestId={}): {}", mailQueueRequest.getRequestId(), e.getMessage());
        }

        try {
            mailReportRepository.save(report);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("mail_reports 저장에 실패했습니다. system_id/foreign key를 확인하세요.");
        }
    }

    private ParsedInspectionData parseInspectionBody(String bodyRaw) {
        if (bodyRaw == null || bodyRaw.isBlank()) {
            throw new IllegalArgumentException("body_raw is empty");
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

        BigDecimal diskUsage = extractOptional(DISK_USAGE_PATTERN, bodyRaw, 1)
                .flatMap(this::toBigDecimal)
                .orElse(null);

        String postfixStatus = extractOptional(POSTFIX_STATUS_PATTERN, bodyRaw, 1)
                .orElse(null);

        String nginxStatus = extractOptional(NGINX_STATUS_PATTERN, bodyRaw, 1)
                .orElse(null);

        return new ParsedInspectionData(
                inspectionTime,
                cpuUsage,
                memTotal,
                memUsed,
                memAvailable,
                memUsage,
                diskUsage,
                postfixStatus,
                nginxStatus
        );
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
        try {
            return Optional.of(LocalDateTime.parse(value, INSPECTION_TIME_FORMAT));
        } catch (DateTimeParseException e) {
            return Optional.empty();
        }
    }

    private Optional<BigDecimal> toBigDecimal(String value) {
        try {
            return Optional.of(new BigDecimal(value.trim()));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
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
            BigDecimal diskUsage,
            String postfixStatus,
            String nginxStatus
    ) {
    }
}
