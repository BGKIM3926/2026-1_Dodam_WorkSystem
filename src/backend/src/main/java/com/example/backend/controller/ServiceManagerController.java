package com.example.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.entity.ServiceManager;
import com.example.backend.repository.LegacyServiceRepository;
import com.example.backend.repository.ServiceManagerRepository;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/service-manager")
public class ServiceManagerController {

    private final ServiceManagerRepository repository;
    private final LegacyServiceRepository legacyServiceRepository;

    public ServiceManagerController(ServiceManagerRepository repository, LegacyServiceRepository legacyServiceRepository) {
        this.repository = repository;
        this.legacyServiceRepository = legacyServiceRepository;
    }

    @GetMapping
    public List<ServiceManager> getByServiceId(@RequestParam Long serviceId) {
        return repository.findByServiceId(serviceId);
    }

    @GetMapping("/all")
    public List<ServiceManager> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ServiceManager create(@RequestBody ServiceManager manager) {
        if (manager.getServiceId() != null && legacyServiceRepository.existsById(manager.getServiceId())) {
            throw new IllegalStateException("해당 서비스는 작업 종료 상태로 정보 등록이 불가합니다.");
        }
        return repository.save(manager);
    }

    @PutMapping("/{id}")
    public ServiceManager update(@PathVariable Long id, @RequestBody ServiceManager request) {
        ServiceManager manager = repository.findById(id).orElseThrow();
        if (manager.getServiceId() != null && legacyServiceRepository.existsById(manager.getServiceId())) {
            throw new IllegalStateException("해당 서비스는 작업 종료 상태로 수정이 불가합니다.");
        }
        manager.setName(request.getName());
        manager.setDept(request.getDept());
        manager.setPhone(request.getPhone());
        manager.setEmail(request.getEmail());
        return repository.save(manager);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalStateException.class)
    public org.springframework.http.ResponseEntity<String> handleIllegalState(IllegalStateException ex) {
        return org.springframework.http.ResponseEntity.badRequest().body(ex.getMessage());
    }
}
