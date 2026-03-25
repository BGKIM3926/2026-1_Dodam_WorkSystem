package com.example.backend.service;

import com.example.backend.dto.WorkHistoryResponseDto;
import com.example.backend.entity.MaintenanceHistory;
import com.example.backend.repository.WorkHistoryRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkHistoryService {

    private final WorkHistoryRepository repository;

    public WorkHistoryService(WorkHistoryRepository repository) {
        this.repository = repository;
    }

    public List<WorkHistoryResponseDto> getHistoryBySystem(Long systemId) {
        return repository.findWithUserName(systemId);
    }

    public MaintenanceHistory create(MaintenanceHistory history) {
        return repository.save(history);
    }

    
    
}
