package com.example.backend.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.dto.HistorySubResponseDto;
import com.example.backend.entity.HistorySub;
import com.example.backend.service.HistorySubService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/history-sub")
public class HistorySubController {

    private final HistorySubService service;

    public HistorySubController(HistorySubService service) {
        this.service = service;
    }

    @GetMapping("/{historyId}")
    public List<HistorySubResponseDto> getByHistoryId(@PathVariable Long historyId) {
        return service.getByHistoryId(historyId);
    }

    @PostMapping("/with-files")
    public HistorySub createWithFiles(
            @RequestPart("data") HistorySub sub,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) throws IOException {

        HistorySub saved = service.create(sub);

        if (files != null && !files.isEmpty()) {
            service.saveAttachments(saved.getSubId(), files);
        }

        return saved;
    }

    @PutMapping("/{id}")
    public HistorySub update(@PathVariable Long id, @RequestBody HistorySub request) {
        return service.update(id, request);
    }

    @PutMapping("/with-files/{id}")
    public HistorySub updateWithFiles(
            @PathVariable Long id,
            @RequestPart("data") HistorySub request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "retainedAttachmentIds", required = false) List<Long> retainedAttachmentIds) throws IOException {

        HistorySub updated = service.update(id, request);
        service.replaceAttachments(updated.getSubId(), retainedAttachmentIds, files);
        return updated;
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
