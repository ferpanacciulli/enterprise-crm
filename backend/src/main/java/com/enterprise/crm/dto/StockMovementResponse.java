package com.enterprise.crm.dto;

import com.enterprise.crm.enums.StockMovementReason;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class StockMovementResponse {
    private Long id;
    private Integer quantityChange;
    private StockMovementReason reason;
    private Long opportunityId;
    private String opportunityTitle;
    private String performedByName;
    private LocalDateTime createdAt;
}
