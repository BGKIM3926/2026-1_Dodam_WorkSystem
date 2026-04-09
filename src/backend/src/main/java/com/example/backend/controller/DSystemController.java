package com.example.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.DSystemDto;
import com.example.backend.dto.DSystemUpdateRequest;
import com.example.backend.service.DSystemService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DSystemController {

    private final DSystemService service;

    public DSystemController(DSystemService service) {
        this.service = service;
    }

    @GetMapping("/dsystem")
    public List<DSystemDto> getAll() {
        return service.getAll();
    }

    @GetMapping("/dsystem/filter")
    public List<DSystemDto> getByService(
        @RequestParam String serviceName,
        @RequestParam String customerName
    )   {
    return service.getByService(serviceName, customerName);
    }

    @PutMapping("/dsystem/{id}")
    public ResponseEntity<?> updateSystem(
            @PathVariable Long id,
            @RequestBody DSystemUpdateRequest request) {
        service.updateSystemWithAccounts(id, request);
        return ResponseEntity.ok().build();
    }
}
