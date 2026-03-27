package com.example.backend.service;

import com.example.backend.dto.DSystemDto;
import com.example.backend.repository.DSystemRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DSystemService {

    private final DSystemRepository repository;

    public DSystemService(DSystemRepository repository) {
        this.repository = repository;
    }

    public List<DSystemDto> getAll() {
        return repository.findAll().stream().map(entity -> {
            DSystemDto dto = new DSystemDto();

            dto.setSystemID(entity.getSystemId());
            dto.setCustomerName(entity.getCustomerName());
            dto.setServiceName(entity.getServiceName());
            dto.setServiceNameMin(entity.getServiceNameMin());
            dto.setSystemName(entity.getSystemName());
            dto.setSystemNameMin(entity.getSystemNameMin());
            dto.setHardwareName(entity.getHardwareName());
            dto.setHardwareInfo(entity.getHardwareInfo());
            dto.setOsName(entity.getOsName());
            dto.setOsIp(entity.getOsIp());
            dto.setOsInfo(entity.getOsInfo());

            return dto;
        }).toList();
    }

    public List<DSystemDto> getByService(String serviceName, String customerName) {
        return repository
                .findByServiceNameMinAndCustomerName(serviceName, customerName)
                .stream()
                .map(entity -> {
                    DSystemDto dto = new DSystemDto();

                    dto.setSystemID(entity.getSystemId());
                    dto.setCustomerName(entity.getCustomerName());
                    dto.setServiceName(entity.getServiceName());
                    dto.setServiceNameMin(entity.getServiceNameMin());
                    dto.setSystemName(entity.getSystemName());
                    dto.setSystemNameMin(entity.getSystemNameMin());
                    dto.setHardwareName(entity.getHardwareName());
                    dto.setHardwareInfo(entity.getHardwareInfo());
                    dto.setOsName(entity.getOsName());
                    dto.setOsIp(entity.getOsIp());
                    dto.setOsInfo(entity.getOsInfo());

                    return dto;
                })
                .toList();
    }
}