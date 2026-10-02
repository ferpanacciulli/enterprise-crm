package com.enterprise.crm.controller;

import com.enterprise.crm.dto.ActivityRequest;
import com.enterprise.crm.dto.ActivityResponse;
import com.enterprise.crm.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Sub-recurso de Opportunity: el historial de mensajes/interacciones vive
// colgado de /api/opportunities/{id}/activities, no es un CRUD independiente.
@RestController
@RequestMapping("/api/opportunities/{opportunityId}/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping
    public List<ActivityResponse> findByOpportunity(@PathVariable Long opportunityId) {
        return activityService.findByOpportunity(opportunityId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SALES_REPRESENTATIVE')")
    public ActivityResponse create(
            @PathVariable Long opportunityId,
            @Valid @RequestBody ActivityRequest request,
            Authentication authentication) {
        return activityService.create(opportunityId, request, authentication.getName());
    }
}
