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
import com.example.backend.repository.ServiceManagerRepository;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/service-manager")
public class ServiceManagerController {

    private final ServiceManagerRepository repository;

    public ServiceManagerController(ServiceManagerRepository repository) {
        this.repository = repository;
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
        return repository.save(manager);
    }

    @PutMapping("/{id}")
    public ServiceManager update(@PathVariable Long id, @RequestBody ServiceManager request) {
        ServiceManager manager = repository.findById(id).orElseThrow();
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
}
