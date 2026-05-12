package com.example.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.MailRequestDto;
import com.example.backend.dto.MailResponseDto;
import com.example.backend.service.MailQueueService;

import jakarta.servlet.http.HttpServletRequest;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/info")
public class InfoController {

    private final MailQueueService mailQueueService;
    private final ObjectMapper objectMapper;

    public InfoController(MailQueueService mailQueueService, ObjectMapper objectMapper) {
        this.mailQueueService = mailQueueService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<MailResponseDto> enqueue(@RequestBody JsonNode payload, HttpServletRequest servletRequest) {
        MailRequestDto request = toMailRequest(payload);
        MailResponseDto response = mailQueueService.enqueue(request, servletRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @PostMapping("/test")
    public ResponseEntity<MailResponseDto> writeDailySummaryForTest() {
        MailResponseDto response = mailQueueService.writeDailyInfoSummaryQueueFileNow();
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    private MailRequestDto toMailRequest(JsonNode payload) {
        if (payload == null || payload.isNull()) {
            throw new IllegalArgumentException("요청 본문이 필요합니다.");
        }

        MailRequestDto request = new MailRequestDto();
        request.setSystemId(readSystemId(payload));
        request.setKey(readKey(payload));
        request.setContent(readContent(payload));
        return request;
    }

    private String readSystemId(JsonNode payload) {
        JsonNode value = payload.get("system_id");
        if (value == null || value.isNull()) {
            value = payload.get("systemId");
        }
        if (value == null || value.isNull()) {
            return null;
        }
        return value.asString();
    }

    private String readKey(JsonNode payload) {
        JsonNode value = payload.get("key");
        if (value == null || value.isNull()) {
            return null;
        }
        return value.asString();
    }

    private String readContent(JsonNode payload) {
        JsonNode content = payload.get("content");
        if (content == null || content.isNull()) {
            return null;
        }
        if (content.isString()) {
            return content.asString();
        }
        return writeJson(content);
    }

    private String writeJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            throw new IllegalArgumentException("요청 JSON을 처리할 수 없습니다.");
        }
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleInternalError(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", e.getMessage()));
    }
}
