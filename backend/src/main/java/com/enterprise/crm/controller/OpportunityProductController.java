package com.enterprise.crm.controller;

import com.enterprise.crm.dto.OpportunityProductRequest;
import com.enterprise.crm.dto.OpportunityProductResponse;
import com.enterprise.crm.service.OpportunityProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Sub-recurso de Opportunity: los productos reservados en una oportunidad
// viven colgados de /api/opportunities/{id}/products, no es un CRUD independiente.
@RestController
@RequestMapping("/api/opportunities/{opportunityId}/products")
@RequiredArgsConstructor
public class OpportunityProductController {

    private final OpportunityProductService opportunityProductService;

    @GetMapping
    public List<OpportunityProductResponse> findByOpportunity(@PathVariable Long opportunityId) {
        return opportunityProductService.findByOpportunity(opportunityId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SALES_REPRESENTATIVE')")
    public OpportunityProductResponse addProduct(
            @PathVariable Long opportunityId,
            @Valid @RequestBody OpportunityProductRequest request,
            Authentication authentication) {
        return opportunityProductService.addProduct(opportunityId, request, authentication.getName());
    }

    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SALES_REPRESENTATIVE')")
    public void removeProduct(
            @PathVariable Long opportunityId,
            @PathVariable Long itemId,
            Authentication authentication) {
        opportunityProductService.removeProduct(opportunityId, itemId, authentication.getName());
    }
}
