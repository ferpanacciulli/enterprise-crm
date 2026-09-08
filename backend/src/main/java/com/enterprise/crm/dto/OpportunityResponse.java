package com.enterprise.crm.dto;

import com.enterprise.crm.enums.OpportunityStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class OpportunityResponse {
    private Long id;
    private String title;
    private BigDecimal amount;
    private OpportunityStage stage;
    private LocalDate expectedCloseDate;
    private Long customerId;
    private String customerName;
    private Long ownerId;
    private String ownerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
