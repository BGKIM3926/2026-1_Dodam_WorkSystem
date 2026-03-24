package com.example.backend.controller;

import com.example.backend.service.WorkHistoryService;
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
    public List<MaintenanceHistory> getHistory(
            @RequestParam Long systemId) {
        return service.getHistoryBySystem(systemId);
    }

    @PostMapping
    public MaintenanceHistory create(
            @RequestBody MaintenanceHistory history) {
        return service.create(history);
    }
}
