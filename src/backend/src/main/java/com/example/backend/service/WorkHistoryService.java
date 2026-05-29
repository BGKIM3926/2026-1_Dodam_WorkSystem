package com.example.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.dto.AttachmentDto;
import com.example.backend.dto.WorkHistoryResponseDto;
import com.example.backend.entity.Attachment;
import com.example.backend.entity.MaintenanceHistory;
import com.example.backend.repository.AttachmentRepository;
import com.example.backend.repository.LegacyServiceRepository;
import com.example.backend.repository.WorkHistoryRepository;

@Service
public class WorkHistoryService {
    private static final String WORK_TYPE_FAULT = "장애조치";
    private static final String WORK_TYPE_SUPPORT = "기술지원";
    private static final String WORK_TYPE_CONSTRUCTION = "구축";

    private final WorkHistoryRepository repository;
    private final AttachmentRepository attachmentRepository;
    private final LegacyServiceRepository legacyServiceRepository;
    private final Path uploadRootDir;
    
    public WorkHistoryService(WorkHistoryRepository repository,
                              AttachmentRepository attachmentRepository,
                              LegacyServiceRepository legacyServiceRepository,
                              @Value("${file.upload-root}") String uploadRoot) {
        this.repository = repository;
        this.attachmentRepository = attachmentRepository;
        this.legacyServiceRepository = legacyServiceRepository;
        this.uploadRootDir = Path.of(uploadRoot).toAbsolutePath().normalize();
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
        normalizeAndValidateVisitDate(history);
        validateCreateRequest(history);

        if (history.getServiceId() != null && legacyServiceRepository.existsById(history.getServiceId())) {
            throw new IllegalStateException("해당 서비스는 작업 종료 상태로 등록할 수 없습니다.");
        }
        return repository.save(history);
    }

    @Transactional(rollbackFor = Exception.class)
    public MaintenanceHistory createWithAttachments(MaintenanceHistory history, List<MultipartFile> files) throws IOException {
        MaintenanceHistory saved = create(history);
        if (files != null && !files.isEmpty()) {
            saveAttachments(saved.getHistoryId(), files);
        }
        return saved;
    }

    public MaintenanceHistory getById(Long id) {
        return repository.findById(id).orElseThrow();
    }

    public MaintenanceHistory save(MaintenanceHistory history) {
        normalizeAndValidateVisitDate(history);
        return repository.save(history);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public void saveAttachments(Long historyId, List<MultipartFile> files) throws IOException {
        Path uploadDir = uploadRootDir;
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

    public void replaceAttachments(Long historyId, List<Long> retainedAttachmentIds, List<MultipartFile> files) throws IOException {
        Set<Long> retainedIds = retainedAttachmentIds == null
                ? Set.of()
                : new HashSet<>(retainedAttachmentIds);

        List<Attachment> existingAttachments = attachmentRepository.findByHistoryId(historyId);

        for (Attachment attachment : existingAttachments) {
            if (!retainedIds.contains(attachment.getAttachmentId())) {
                deleteAttachmentFile(attachment);
                attachmentRepository.delete(attachment);
            }
        }

        if (files != null && !files.isEmpty()) {
            saveAttachments(historyId, files);
        }
    }

    private void deleteAttachmentFile(Attachment attachment) throws IOException {
        if (attachment.getFilePath() == null || attachment.getFilePath().isBlank()) {
            return;
        }

        Files.deleteIfExists(Path.of(attachment.getFilePath()));
    }

    private void validateCreateRequest(MaintenanceHistory history) {
        String workType = history.getWorkType() == null ? "" : history.getWorkType().trim();
        boolean isFaultOrSupport = WORK_TYPE_FAULT.equals(workType) || WORK_TYPE_SUPPORT.equals(workType);
        boolean isConstruction = WORK_TYPE_CONSTRUCTION.equals(workType);

        if (isFaultOrSupport || isConstruction) {
            if (isBlank(history.getIssue())) {
                throw new IllegalStateException("내용을 입력해 주세요.");
            }
            if (isBlank(history.getIssueDetail())) {
                throw new IllegalStateException("내용 상세를 입력해 주세요.");
            }
        }

        if (isConstruction) {
            if (history.getConstructionStartDate() == null || history.getConstructionEndDate() == null) {
                throw new IllegalStateException("구축기간(시작일/종료일)을 모두 선택해 주세요.");
            }
        }
    }

    private void normalizeAndValidateVisitDate(MaintenanceHistory history) {
        if (history.getVisitDate() == null) {
            history.setVisitDate(LocalDate.now());
            return;
        }

        if (history.getVisitDate().isAfter(LocalDate.now())) {
            throw new IllegalStateException("현재 이후의 날짜는 선택할 수 없습니다");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
    
}
