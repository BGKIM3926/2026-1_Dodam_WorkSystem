package com.example.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.dto.AttachmentDto;
import com.example.backend.dto.WorkHistoryResponseDto;
import com.example.backend.entity.Attachment;
import com.example.backend.entity.MaintenanceHistory;
import com.example.backend.repository.AttachmentRepository;
import com.example.backend.repository.WorkHistoryRepository;

@Service
public class WorkHistoryService {

    private final WorkHistoryRepository repository;
    private final AttachmentRepository attachmentRepository;
    
    public WorkHistoryService(WorkHistoryRepository repository, AttachmentRepository attachmentRepository) {
        this.repository = repository;
        this.attachmentRepository = attachmentRepository;
    }

    public List<WorkHistoryResponseDto> getHistoryByServiceId(Long serviceId) {
        List<WorkHistoryResponseDto> list = repository.findWithUserNameByServiceId(serviceId);

        for (WorkHistoryResponseDto dto : list) {
            List<Attachment> files = attachmentRepository.findByHistoryId(dto.getHistoryId());

            List<AttachmentDto> fileDtos = files.stream()
                    .map(f -> new AttachmentDto(f.getAttachmentId(), f.getFileName()))
                    .toList();

            dto.setAttachments(fileDtos);
        }

        return list;
    }

    public List<WorkHistoryResponseDto> getHistoryByService(String serviceName) {

        // 1️⃣ 기존 이력 조회
        List<WorkHistoryResponseDto> list = repository.findWithUserName(serviceName);

        // 2️⃣ 각 이력마다 첨부파일 붙이기
        for (WorkHistoryResponseDto dto : list) {

            // 🔥 historyId로 파일 조회
            List<Attachment> files =
                    attachmentRepository.findByHistoryId(dto.getHistoryId());

            // 🔥 DTO로 변환
            List<AttachmentDto> fileDtos = files.stream()
                    .map(f -> new AttachmentDto(
                            f.getAttachmentId(),
                            f.getFileName()
                    ))
                    .toList();

            // 🔥 DTO에 넣기
            dto.setAttachments(fileDtos);
        }

        return list;
    }

    public List<WorkHistoryResponseDto> getAll() {
        List<WorkHistoryResponseDto> list = repository.findAllWithUserName();

        for (WorkHistoryResponseDto dto : list) {
            List<Attachment> files = attachmentRepository.findByHistoryId(dto.getHistoryId());

            List<AttachmentDto> fileDtos = files.stream()
                .map(f -> new AttachmentDto(f.getAttachmentId(), f.getFileName(), null))
                .toList();

            dto.setAttachments(fileDtos);
        }

        return list;
    }

    public MaintenanceHistory create(MaintenanceHistory history) {
        return repository.save(history);
    }

    public MaintenanceHistory getById(Long id) {
        return repository.findById(id).orElseThrow();
    }

    public MaintenanceHistory save(MaintenanceHistory history) {
        return repository.save(history);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public void saveAttachments(Long historyId, List<MultipartFile> files) throws IOException {
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
            attachment.setHistoryId(historyId);
            attachment.setFileName(originalName);
            attachment.setFilePath(targetPath.toString());
            attachment.setFileSize(file.getSize());

            attachmentRepository.save(attachment);
        }
    }
    
}
