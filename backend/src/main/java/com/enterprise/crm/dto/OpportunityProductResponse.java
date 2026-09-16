package com.enterprise.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class OpportunityProductResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
    private LocalDateTime createdAt;
}
