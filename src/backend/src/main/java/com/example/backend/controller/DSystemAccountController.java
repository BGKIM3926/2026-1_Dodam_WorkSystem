package com.example.backend.controller;

import com.example.backend.dto.DSystemAccountDto;
import com.example.backend.service.DSystemAccountService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class DSystemAccountController {

    private final DSystemAccountService service;

    public DSystemAccountController(DSystemAccountService service) {
        this.service = service;
    }

    @GetMapping("/account")
    public List<DSystemAccountDto> getAccounts(@RequestParam int systemId) {
        return service.getAccountsBySystemId(systemId);
    }
}