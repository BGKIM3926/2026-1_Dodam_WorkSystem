package com.example.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.LegacyServiceCheckResponseDto;
import com.example.backend.dto.LegacyServiceOptionDto;
import com.example.backend.dto.LegacyServiceRequestDto;
import com.example.backend.service.LegacyServiceService;

@RestController
@RequestMapping("/api/legacy-service")
@CrossOrigin(origins = "*")
public class LegacyServiceController {

    private final LegacyServiceService legacyServiceService;

    public LegacyServiceController(LegacyServiceService legacyServiceService) {
        this.legacyServiceService = legacyServiceService;
    }

    @GetMapping("/ids")
    public List<Long> getLegacyServiceIds() {
        return legacyServiceService.getLegacyServiceIds();
    }

    @GetMapping("/options")
    public List<LegacyServiceOptionDto> getServiceOptions() {
        return legacyServiceService.getServiceOptions();
    }

    @GetMapping("/check")
    public LegacyServiceCheckResponseDto check(@RequestParam Long serviceId) {
        return new LegacyServiceCheckResponseDto(legacyServiceService.isLegacyService(serviceId));
    }

    @PostMapping
    public ResponseEntity<?> mark(@RequestBody LegacyServiceRequestDto request) {
        legacyServiceService.markAsLegacy(request.getServiceId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{serviceId}")
    public ResponseEntity<?> unmark(@PathVariable Long serviceId) {
        legacyServiceService.unmarkAsLegacy(serviceId);
        return ResponseEntity.ok().build();
    }
}

