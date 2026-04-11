package com.example.backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BulkSyncPreviewResponseDto {
    private String target;
    private BulkSyncSummaryDto summary;
    private List<BulkSyncChangeItemDto> changes;
}
