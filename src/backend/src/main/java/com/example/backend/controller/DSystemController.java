package com.example.backend.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.dto.BulkSyncApplyResponseDto;
import com.example.backend.dto.BulkSyncPreviewResponseDto;
import com.example.backend.dto.DSystemDto;
import com.example.backend.dto.DSystemUpdateRequest;
import com.example.backend.service.DSystemBulkSyncService;
import com.example.backend.service.DSystemService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DSystemController {
    private static final DateTimeFormatter FILE_TS = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private final DSystemService service;
    private final DSystemBulkSyncService bulkSyncService;

    public DSystemController(DSystemService service, DSystemBulkSyncService bulkSyncService) {
        this.service = service;
        this.bulkSyncService = bulkSyncService;
    }

    @GetMapping("/dsystem")
    public List<DSystemDto> getAll() {
        return service.getAll();
    }

    @GetMapping("/dsystem/version-options")
    public List<DSystemDto> getVersionOptions() {
        return service.getVersionOptions();
    }

    @GetMapping("/dsystem/filter")
    public List<DSystemDto> getByService(
        @RequestParam String serviceName,
        @RequestParam String customerName
    )   {
    return service.getByService(serviceName, customerName);
    }

    @PutMapping("/dsystem/{id}")
    public ResponseEntity<?> updateSystem(
            @PathVariable Long id,
            @RequestBody DSystemUpdateRequest request) {
        service.updateSystemWithAccounts(id, request);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/dsystem/{id}/version")
    public ResponseEntity<?> updateSystemVersion(
            @PathVariable Long id,
            @RequestBody DSystemUpdateRequest request) {
        service.updateSystemVersion(id, request.getVersion());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/dsystem")
    public ResponseEntity<?> createSystem(@RequestBody DSystemUpdateRequest request) {
        try {
            service.createSystemWithAccounts(request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    @GetMapping("/dsystem/export/dsystem")
    public ResponseEntity<byte[]> exportDSystemExcel(
            @RequestParam(required = false) String customerName
    ) {
        byte[] content = service.exportDSystemExcel(customerName);
        return buildExcelDownloadResponse("dsystem", content);
    }

    @GetMapping("/dsystem/export/dsystemaccount")
    public ResponseEntity<byte[]> exportDSystemAccountExcel(
            @RequestParam(required = false) String customerName
    ) {
        byte[] content = service.exportDSystemAccountExcel(customerName);
        return buildExcelDownloadResponse("dsystemaccount", content);
    }

    @PostMapping("/dsystem/bulk-sync/preview/dsystem")
    public ResponseEntity<?> previewDSystem(@RequestParam("file") MultipartFile file) {
        try {
            BulkSyncPreviewResponseDto response = bulkSyncService.previewDSystem(file);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    @PostMapping("/dsystem/bulk-sync/preview/dsystemaccount")
    public ResponseEntity<?> previewDSystemAccount(@RequestParam("file") MultipartFile file) {
        try {
            BulkSyncPreviewResponseDto response = bulkSyncService.previewDSystemAccount(file);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    @PostMapping("/dsystem/bulk-sync/apply")
    public ResponseEntity<?> applyBulkSync(
            @RequestParam(value = "dsystemFile", required = false) MultipartFile dsystemFile,
            @RequestParam(value = "dsystemNoChange", defaultValue = "false") boolean dsystemNoChange,
            @RequestParam(value = "dsystemAccountFile", required = false) MultipartFile dsystemAccountFile,
            @RequestParam(value = "dsystemAccountNoChange", defaultValue = "false") boolean dsystemAccountNoChange
    ) {
        try {
            if (dsystemNoChange && dsystemAccountNoChange) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("두 파일 모두 변동 없음으로 처리할 수 없습니다.");
            }

            BulkSyncApplyResponseDto response = bulkSyncService.apply(
                    dsystemFile,
                    dsystemNoChange,
                    dsystemAccountFile,
                    dsystemAccountNoChange
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    private ResponseEntity<byte[]> buildExcelDownloadResponse(String filePrefix, byte[] content) {
        String filename = filePrefix + "_" + LocalDateTime.now().format(FILE_TS) + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(content);
    }
}
