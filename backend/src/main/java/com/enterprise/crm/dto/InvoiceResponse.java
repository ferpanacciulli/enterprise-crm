package com.enterprise.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private Long customerId;
    private String customerCompanyName;
    private String customerContactName;
    private String customerEmail;
    private String customerAddress;
    private String createdByName;
    private BigDecimal total;
    private LocalDateTime issueDate;
    private List<InvoiceItemResponse> items;
}
