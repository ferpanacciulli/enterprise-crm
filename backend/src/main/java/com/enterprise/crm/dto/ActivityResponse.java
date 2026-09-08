package com.enterprise.crm.dto;

import com.enterprise.crm.enums.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ActivityResponse {
    private Long id;
    private ActivityType type;
    private String description;
    private LocalDateTime activityDate;
    private Long opportunityId;
    private String createdByName;
}
