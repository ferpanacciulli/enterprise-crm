package com.enterprise.crm.controller;

import com.enterprise.crm.dto.OpportunityRequest;
import com.enterprise.crm.dto.OpportunityResponse;
import com.enterprise.crm.service.OpportunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/opportunities")
@RequiredArgsConstructor
public class OpportunityController {

    private final OpportunityService opportunityService;

    @GetMapping
    public List<OpportunityResponse> findAll() {
        return opportunityService.findAll();
    }

    @GetMapping("/{id}")
    public OpportunityResponse findById(@PathVariable Long id) {
        return opportunityService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SALES_REPRESENTATIVE')")
    public OpportunityResponse create(@Valid @RequestBody OpportunityRequest request, Authentication authentication) {
        return opportunityService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SALES_REPRESENTATIVE')")
    public OpportunityResponse update(@PathVariable Long id, @Valid @RequestBody OpportunityRequest request) {
        return opportunityService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void delete(@PathVariable Long id, Authentication authentication) {
        opportunityService.delete(id, authentication.getName());
    }
}
