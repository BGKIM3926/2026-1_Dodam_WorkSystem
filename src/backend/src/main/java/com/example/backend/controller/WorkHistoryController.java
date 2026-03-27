package com.example.backend.controller;

import com.example.backend.service.WorkHistoryService;
import com.example.backend.dto.WorkHistoryResponseDto;
import com.example.backend.entity.MaintenanceHistory;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/history")
public class WorkHistoryController {

    private final WorkHistoryService service;

    public WorkHistoryController(WorkHistoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorkHistoryResponseDto> getHistory(@RequestParam String serviceName) {
        return service.getHistoryByService(serviceName);
    }

    @GetMapping("/all")
    public List<WorkHistoryResponseDto> getAllHistory() {
        return service.getAll();
    }

    @PostMapping
    public MaintenanceHistory create(
            @RequestBody MaintenanceHistory history) {
        return service.create(history);
    }

    @PutMapping("/{id}")
    public MaintenanceHistory update(
            @PathVariable Long id,
            @RequestBody MaintenanceHistory request) {

        MaintenanceHistory history = service.getById(id);

        history.setWorkType(request.getWorkType());
        history.setIssue(request.getIssue());
        history.setEquipment(request.getEquipment());

        return service.save(history);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
