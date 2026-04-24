package com.example.backend.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.util.UriUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.backend.dto.WorkHistoryResponseDto;
import com.example.backend.entity.Attachment;
import com.example.backend.entity.MaintenanceHistory;
import com.example.backend.repository.AttachmentRepository;
import com.example.backend.service.WorkHistoryService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/history")
public class WorkHistoryController {
    private static final Logger log = LoggerFactory.getLogger(WorkHistoryController.class);

    private final WorkHistoryService service;
    private final AttachmentRepository attachmentRepository;
    private final Path uploadRootDir;

    public WorkHistoryController(WorkHistoryService service,
                                 AttachmentRepository attachmentRepository,
                                 @Value("${file.upload-root}") String uploadRoot) {
        this.service = service;
        this.attachmentRepository = attachmentRepository;
        this.uploadRootDir = Path.of(uploadRoot).toAbsolutePath().normalize();
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
        @RequestPart(value = "files", required = false) List<MultipartFile> files,
        @RequestPart(value = "files[]", required = false) List<MultipartFile> filesArray,
        @RequestParam(value = "files", required = false) List<MultipartFile> filesFromParam,
        @RequestParam(value = "files[]", required = false) List<MultipartFile> filesArrayFromParam,
        @RequestParam(value = "expectedFileCount", required = false) Integer expectedFileCount
    ) throws IOException {
        List<MultipartFile> uploadedFiles = mergeFiles(files, filesArray, filesFromParam, filesArrayFromParam);
        int expected = expectedFileCount == null ? 0 : expectedFileCount;
        int received = uploadedFiles.size();

        log.info("createWithFiles called: expectedFileCount={}, receivedFileCount={}, serviceId={}, workType={}",
                expected, received, history.getServiceId(), history.getWorkType());

        if (expected > 0 && received == 0) {
            throw new IllegalStateException("첨부파일이 서버로 전송되지 않았습니다. 새로고침 후 다시 시도해 주세요.");
        }

        return service.createWithAttachments(history, uploadedFiles);
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

        Path path = resolveAttachmentPath(file);
        if (path == null || !Files.exists(path)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String encoded = UriUtils.encode(file.getFileName(), StandardCharsets.UTF_8);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
            .body(resource);
    }

    private Path resolveAttachmentPath(Attachment attachment) {
        if (attachment.getFilePath() == null || attachment.getFilePath().isBlank()) {
            return null;
        }

        Path storedPath = Paths.get(attachment.getFilePath());
        if (Files.exists(storedPath)) {
            return storedPath;
        }

        String fileName = extractFileName(attachment.getFilePath());
        if (fileName == null || fileName.isBlank()) {
            return null;
        }

        Path migratedPath = uploadRootDir.resolve(fileName).normalize();
        if (!migratedPath.startsWith(uploadRootDir)) {
            return null;
        }

        return migratedPath;
    }

    private String extractFileName(String path) {
        int slash = path.lastIndexOf('/');
        int backslash = path.lastIndexOf('\\');
        int cut = Math.max(slash, backslash);
        return cut >= 0 ? path.substring(cut + 1) : path;
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @SafeVarargs
    private static List<MultipartFile> mergeFiles(List<MultipartFile>... fileLists) {
        List<MultipartFile> merged = new ArrayList<>();
        for (List<MultipartFile> list : fileLists) {
            if (list == null || list.isEmpty()) {
                continue;
            }
            for (MultipartFile file : list) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                merged.add(file);
            }
        }
        return merged.stream().filter(Objects::nonNull).toList();
    }
}
