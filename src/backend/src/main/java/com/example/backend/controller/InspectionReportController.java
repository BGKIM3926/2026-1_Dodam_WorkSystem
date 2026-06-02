package com.example.backend.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.InspectionReportGenerateRequest;
import com.example.backend.service.InspectionReportService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/inspectionreport")
public class InspectionReportController {

    private final InspectionReportService inspectionReportService;

    public InspectionReportController(InspectionReportService inspectionReportService) {
        this.inspectionReportService = inspectionReportService;
    }

    @PostMapping(value = "/generate", produces = MediaType.TEXT_HTML_VALUE + ";charset=UTF-8")
    public ResponseEntity<String> generate(@RequestBody InspectionReportGenerateRequest request) {
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "html", StandardCharsets.UTF_8))
                .body(inspectionReportService.generateHtml(request.getInfoIds()));
    }

    @GetMapping("/assets/{fileName:.+}")
    public ResponseEntity<Resource> getAsset(@PathVariable String fileName) throws IOException {
        Resource resource = new ClassPathResource("templates/" + fileName);
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .contentType(resolveMediaType(fileName))
                .body(resource);
    }

    private MediaType resolveMediaType(String fileName) {
        String lower = fileName == null ? "" : fileName.toLowerCase();
        if (lower.endsWith(".css")) {
            return new MediaType("text", "css", StandardCharsets.UTF_8);
        }
        if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleInternalError(IllegalStateException e) {
        return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
    }
}
