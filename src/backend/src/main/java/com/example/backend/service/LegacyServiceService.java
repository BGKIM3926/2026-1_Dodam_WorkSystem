package com.example.backend.service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.LegacyServiceOptionDto;
import com.example.backend.entity.DSystem;
import com.example.backend.entity.LegacyService;
import com.example.backend.repository.DSystemRepository;
import com.example.backend.repository.LegacyServiceRepository;

@Service
public class LegacyServiceService {

    private final LegacyServiceRepository legacyServiceRepository;
    private final DSystemRepository dSystemRepository;

    public LegacyServiceService(LegacyServiceRepository legacyServiceRepository, DSystemRepository dSystemRepository) {
        this.legacyServiceRepository = legacyServiceRepository;
        this.dSystemRepository = dSystemRepository;
    }

    public List<Long> getLegacyServiceIds() {
        return legacyServiceRepository.findAll().stream()
                .map(LegacyService::getServiceId)
                .toList();
    }

    public boolean isLegacyService(Long serviceId) {
        if (serviceId == null) {
            return false;
        }
        return legacyServiceRepository.existsById(serviceId);
    }

    @Transactional
    public void markAsLegacy(Long serviceId) {
        if (serviceId == null) {
            throw new IllegalArgumentException("serviceId is required.");
        }
        LegacyService entity = new LegacyService();
        entity.setServiceId(serviceId);
        legacyServiceRepository.save(entity);
    }

    @Transactional
    public void unmarkAsLegacy(Long serviceId) {
        if (serviceId == null) {
            throw new IllegalArgumentException("serviceId is required.");
        }
        legacyServiceRepository.deleteById(serviceId);
    }

    public List<LegacyServiceOptionDto> getServiceOptions() {
        Set<Long> legacyIds = Set.copyOf(getLegacyServiceIds());
        Map<Long, LegacyServiceOptionDto> unique = new LinkedHashMap<>();

        for (DSystem row : dSystemRepository.findAll()) {
            if (row.getServiceId() == null) {
                continue;
            }

            unique.putIfAbsent(row.getServiceId(), new LegacyServiceOptionDto(
                    row.getServiceId(),
                    row.getCustomerName(),
                    row.getServiceNameMin(),
                    legacyIds.contains(row.getServiceId())
            ));
        }

        return unique.values().stream()
                .sorted(Comparator.comparing(
                        item -> safe(item.getCustomerName()) + " " + safe(item.getServiceName())))
                .collect(Collectors.toList());
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}

