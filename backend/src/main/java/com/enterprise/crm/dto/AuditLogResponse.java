package com.enterprise.crm.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Vista de una entrada del audit log. Se expone solo a ADMIN (ver AuditLogController).
 */
@Getter
@Builder
public class AuditLogResponse {

    private Long id;

    private String entityName;

    private Long entityId;

    private String action;

    private String username;

    private String ipAddress;

    private String details;

    private LocalDateTime createdAt;
}
