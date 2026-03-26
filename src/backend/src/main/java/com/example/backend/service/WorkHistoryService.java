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

    public List<WorkHistoryResponseDto> getAll() {
        return repository.findAllWithUserName();
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
    
}
