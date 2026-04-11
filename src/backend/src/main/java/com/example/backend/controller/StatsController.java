package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.service.StatsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/summary")
    public Map<String, Object> getSummary(@RequestParam(required = false) String workerId) {
        return statsService.getSummary(workerId);
    }

    @GetMapping("/missing-inspections")
    public List<Map<String, Object>> getMissingInspections(@RequestParam(required = false) String workerId) {
        return statsService.getMissingInspections(workerId);
    }

    @GetMapping("/recent")
    public List<Map<String, Object>> getRecentHistory(@RequestParam(required = false) String workerId) {
        return statsService.getRecentHistory(workerId);
    }
}
