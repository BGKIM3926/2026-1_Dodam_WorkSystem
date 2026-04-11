package com.example.backend.controller;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.dto.WorkHistoryResponseDto;
import com.example.backend.entity.Attachment;
import com.example.backend.entity.MaintenanceHistory;
import com.example.backend.repository.AttachmentRepository;
import com.example.backend.service.WorkHistoryService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/history")
public class WorkHistoryController {

    private final WorkHistoryService service;
    private final AttachmentRepository attachmentRepository;

    public WorkHistoryController(WorkHistoryService service, AttachmentRepository attachmentRepository) {
        this.service = service;
        this.attachmentRepository = attachmentRepository;
    }

    @GetMapping
    public List<WorkHistoryResponseDto> getHistory(
            @RequestParam(required = false) String serviceName,
            @RequestParam(required = false) Long serviceId) {
        if (serviceId != null) {
            return service.getHistoryByServiceId(serviceId);
        }
        return service.getHistoryByService(serviceName);
    }

    @GetMapping("/all")
    public List<WorkHistoryResponseDto> getAllHistory() {
        return service.getAll();
    }

    @PostMapping("/with-files")
    public MaintenanceHistory createWithFiles(
        @RequestPart("data") MaintenanceHistory history,
        @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) throws IOException {

        MaintenanceHistory saved = service.create(history);

        if (files != null && !files.isEmpty()) {
            service.saveAttachments(saved.getHistoryId(), files);
        }

        return saved;
    }

    @PutMapping("/{id}")
    public MaintenanceHistory update(
            @PathVariable Long id,
            @RequestBody MaintenanceHistory request) {

        MaintenanceHistory history = service.getById(id);

        history.setWorkType(request.getWorkType());
        history.setIssue(request.getIssue());
        history.setEquipment(request.getEquipment());
        history.setCompletedDate(request.getCompletedDate());
        history.setConstructionStartDate(request.getConstructionStartDate());
        history.setConstructionEndDate(request.getConstructionEndDate());

        return service.save(history);
    }

    @PutMapping("/with-files/{id}")
    public MaintenanceHistory updateWithFiles(
            @PathVariable Long id,
            @RequestPart("data") MaintenanceHistory request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "retainedAttachmentIds", required = false) List<Long> retainedAttachmentIds) throws IOException {

        MaintenanceHistory history = service.getById(id);

        history.setIssue(request.getIssue());
        history.setIssueDetail(request.getIssueDetail());
        history.setEquipment(request.getEquipment());
        history.setCompletedDate(request.getCompletedDate());
        history.setConstructionStartDate(request.getConstructionStartDate());
        history.setConstructionEndDate(request.getConstructionEndDate());

        MaintenanceHistory saved = service.save(history);
        service.replaceAttachments(saved.getHistoryId(), retainedAttachmentIds, files);

        return saved;
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @GetMapping("/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws IOException {
        Attachment file = attachmentRepository.findById(id).orElseThrow();

        Path path = Paths.get(file.getFilePath());
        Resource resource = new UrlResource(path.toUri());

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
            .body(resource);
    }
}
