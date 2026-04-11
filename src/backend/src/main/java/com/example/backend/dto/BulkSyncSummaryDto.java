package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BulkSyncSummaryDto {
    private int created;
    private int updated;
    private int deleted;

    public int getTotalChanged() {
        return created + updated + deleted;
    }
}
