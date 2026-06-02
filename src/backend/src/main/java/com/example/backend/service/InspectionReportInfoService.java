package com.example.backend.service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.InspectionReportInfoDto;
import com.example.backend.entity.DSystem;
import com.example.backend.entity.Info;
import com.example.backend.repository.DSystemRepository;
import com.example.backend.repository.InfoRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class InspectionReportInfoService {

    private final InfoRepository infoRepository;
    private final DSystemRepository dSystemRepository;
    private final ObjectMapper objectMapper;

    public InspectionReportInfoService(
            InfoRepository infoRepository,
            DSystemRepository dSystemRepository,
            ObjectMapper objectMapper
    ) {
        this.infoRepository = infoRepository;
        this.dSystemRepository = dSystemRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<InspectionReportInfoDto> getReportInfos(Long serviceId) {
        return infoRepository.findAllByOrderByTimeDesc().stream()
                .map(this::toDto)
                .filter(Objects::nonNull)
                .filter(dto -> serviceId == null || isInService(dto.getSystemId(), serviceId))
                .toList();
    }

    private InspectionReportInfoDto toDto(Info info) {
        Long systemId = readSystemId(info.getBodyRawJson()).orElse(null);
        String systemName = systemId == null
                ? "-"
                : dSystemRepository.findById(systemId)
                        .map(this::displaySystemName)
                        .orElse("system_id " + systemId);

        return new InspectionReportInfoDto(info.getId(), systemId, systemName, info.getTime());
    }

    private boolean isInService(Long systemId, Long serviceId) {
        if (systemId == null) {
            return false;
        }

        return dSystemRepository.findById(systemId)
                .map(DSystem::getServiceId)
                .map(serviceId::equals)
                .orElse(false);
    }

    private String displaySystemName(DSystem system) {
        if (hasText(system.getSystemName())) {
            return system.getSystemName();
        }
        if (hasText(system.getSystemNameMin())) {
            return system.getSystemNameMin();
        }
        return "system_id " + system.getSystemId();
    }

    private Optional<Long> readSystemId(String bodyRawJson) {
        if (!hasText(bodyRawJson)) {
            return Optional.empty();
        }

        try {
            JsonNode root = objectMapper.readTree(bodyRawJson);
            return readLong(root, "system_id")
                    .or(() -> readLong(root, "systemId"))
                    .or(() -> readLong(root, "dsystem_id"))
                    .or(() -> readLong(root, "dsystemId"));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private Optional<Long> readLong(JsonNode node, String fieldName) {
        if (node == null || node.isNull()) {
            return Optional.empty();
        }

        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull()) {
            return Optional.empty();
        }

        String text = value.asString();
        if (!hasText(text) || !text.matches("\\d+")) {
            return Optional.empty();
        }

        try {
            return Optional.of(Long.parseLong(text));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
