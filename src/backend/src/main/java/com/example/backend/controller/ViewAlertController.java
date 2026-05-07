package com.example.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.service.MailQueueService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/view_alert")
public class ViewAlertController {

    private final MailQueueService mailQueueService;

    public ViewAlertController(MailQueueService mailQueueService) {
        this.mailQueueService = mailQueueService;
    }

    @GetMapping(produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> viewAlert(@RequestParam("id") Long id) {
        String html = mailQueueService.buildInfoContentTablePage(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/html; charset=UTF-8"))
                .body(html);
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
