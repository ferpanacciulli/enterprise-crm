package com.enterprise.crm.controller;

import com.enterprise.crm.dto.AuditLogResponse;
import com.enterprise.crm.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * "Quien hizo que y cuando" es lo primero que pide un duenio de negocio cuando
 * algo sale mal. Solo ADMIN puede verlo.
 */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditService auditService;

    @GetMapping
    public List<AuditLogResponse> findRecent(@RequestParam(defaultValue = "100") int limit) {
        return auditService.findRecent(limit);
    }
}
