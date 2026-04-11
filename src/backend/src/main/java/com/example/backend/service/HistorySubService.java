package com.example.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.dto.AttachmentDto;
import com.example.backend.dto.HistorySubResponseDto;
import com.example.backend.entity.Attachment;
import com.example.backend.entity.HistorySub;
import com.example.backend.repository.AttachmentRepository;
import com.example.backend.repository.HistorySubRepository;

@Service
public class HistorySubService {

    private final HistorySubRepository repository;
    private final AttachmentRepository attachmentRepository;

    public HistorySubService(HistorySubRepository repository, AttachmentRepository attachmentRepository) {
        this.repository = repository;
        this.attachmentRepository = attachmentRepository;
    }

    public List<HistorySubResponseDto> getByHistoryId(Long historyId) {
        List<HistorySub> subs = repository.findByHistoryIdOrderByCreatedAtAsc(historyId);

        return subs.stream().map(sub -> {
            List<Attachment> files = attachmentRepository.findBySubId(sub.getSubId());
            List<AttachmentDto> fileDtos = files.stream()
                    .map(f -> new AttachmentDto(f.getAttachmentId(), f.getFileName()))
                    .toList();
            HistorySubResponseDto dto = new HistorySubResponseDto(
                    sub.getSubId(), sub.getHistoryId(), sub.getContent(),
                    sub.getContentDetail(), sub.getCreatedAt());
            dto.setAttachments(fileDtos);
            return dto;
        }).toList();
    }

    public HistorySub create(HistorySub sub) {
        return repository.save(sub);
    }

    public HistorySub getById(Long id) {
        return repository.findById(id).orElseThrow();
    }

    public HistorySub update(Long id, HistorySub request) {
        HistorySub sub = repository.findById(id).orElseThrow();
        sub.setContent(request.getContent());
        sub.setContentDetail(request.getContentDetail());
        return repository.save(sub);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public void saveAttachments(Long subId, List<MultipartFile> files) throws IOException {
        Path uploadDir = Path.of(System.getProperty("user.dir"), "uploads");
        Files.createDirectories(uploadDir);

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            String originalName = StringUtils.cleanPath(file.getOriginalFilename());
            String storedName = UUID.randomUUID() + "_" + originalName;
            Path targetPath = uploadDir.resolve(storedName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            Attachment attachment = new Attachment();
            attachment.setSubId(subId);
            attachment.setFileName(originalName);
            attachment.setFilePath(targetPath.toString());
            attachment.setFileSize(file.getSize());

            attachmentRepository.save(attachment);
        }
    }

    public void replaceAttachments(Long subId, List<Long> retainedAttachmentIds, List<MultipartFile> files) throws IOException {
        Set<Long> retainedIds = retainedAttachmentIds == null
                ? Set.of()
                : new HashSet<>(retainedAttachmentIds);

        List<Attachment> existingAttachments = attachmentRepository.findBySubId(subId);

        for (Attachment attachment : existingAttachments) {
            if (!retainedIds.contains(attachment.getAttachmentId())) {
                deleteAttachmentFile(attachment);
                attachmentRepository.delete(attachment);
            }
        }

        if (files != null && !files.isEmpty()) {
            saveAttachments(subId, files);
        }
    }

    private void deleteAttachmentFile(Attachment attachment) throws IOException {
        if (attachment.getFilePath() == null || attachment.getFilePath().isBlank()) {
            return;
        }

        Files.deleteIfExists(Path.of(attachment.getFilePath()));
    }
}
