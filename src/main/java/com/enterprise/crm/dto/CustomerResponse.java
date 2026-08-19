package com.enterprise.crm.dto;

import com.enterprise.crm.enums.CustomerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class CustomerResponse {
    private Long id;
    private String companyName;
    private String contactName;
    private String email;
    private String phone;
    private String industry;
    private String country;
    private String city;
    private CustomerStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}