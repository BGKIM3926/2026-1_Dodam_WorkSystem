package com.example.backend.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BulkSyncChangeItemDto {
    private String status;
    private String key;
    private List<String> changedFields;
    private Map<String, String> currentValues;
    private Map<String, String> uploadedValues;
}
