package com.example.backend.controller;

import com.example.backend.dto.DSystemDto;
import com.example.backend.service.DSystemService;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
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
}
