package com.example.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.backend.dto.MailRequestDto;
import com.example.backend.dto.MailResponseDto;
import com.example.backend.entity.MailQueueRequest;
import com.example.backend.repository.MailQueueRequestRepository;

@Service
public class MailQueueService {

    private static final int MAX_SYSTEM_ID_LENGTH = 100;
    private static final int MAX_BODY_LENGTH = 65535;
    private static final DateTimeFormatter FILE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss-SSS");

    private final MailQueueRequestRepository mailQueueRequestRepository;

    @Value("${mail.queue-dir:mail-queue}")
    private String queueDir;

    public MailQueueService(MailQueueRequestRepository mailQueueRequestRepository) {
        this.mailQueueRequestRepository = mailQueueRequestRepository;
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
}
