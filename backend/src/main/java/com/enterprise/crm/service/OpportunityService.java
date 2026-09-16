package com.enterprise.crm.service;

import com.enterprise.crm.dto.OpportunityRequest;
import com.enterprise.crm.dto.OpportunityResponse;
import com.enterprise.crm.entity.Customer;
import com.enterprise.crm.entity.Opportunity;
import com.enterprise.crm.entity.User;
import com.enterprise.crm.exception.ResourceNotFoundException;
import com.enterprise.crm.mapper.OpportunityMapper;
import com.enterprise.crm.repository.CustomerRepository;
import com.enterprise.crm.repository.OpportunityRepository;
import com.enterprise.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final OpportunityMapper opportunityMapper;
    private final OpportunityProductService opportunityProductService;

    public List<OpportunityResponse> findAll() {
        return opportunityRepository.findAll().stream()
                .map(opportunityMapper::toResponse)
                .toList();
    }

    public OpportunityResponse findById(Long id) {
        return opportunityMapper.toResponse(getEntityOrThrow(id));
    }

    @Transactional
    public OpportunityResponse create(OpportunityRequest request, String ownerEmail) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Cliente no encontrado: " + request.getCustomerId()));

        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + ownerEmail));

        Opportunity opportunity = opportunityMapper.toEntity(request);
        opportunity.setCustomer(customer);
        opportunity.setOwner(owner);

        return opportunityMapper.toResponse(opportunityRepository.save(opportunity));
    }

    @Transactional
    public OpportunityResponse update(Long id, OpportunityRequest request) {
        Opportunity opportunity = getEntityOrThrow(id);

        if (!opportunity.getCustomer().getId().equals(request.getCustomerId())) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Cliente no encontrado: " + request.getCustomerId()));
            opportunity.setCustomer(customer);
        }

        opportunityMapper.updateEntityFromRequest(request, opportunity);
        return opportunityMapper.toResponse(opportunityRepository.save(opportunity));
    }

    @Transactional
    public void delete(Long id, String actingUserEmail) {
        Opportunity opportunity = getEntityOrThrow(id);
        // Libera cualquier stock reservado por esta oportunidad antes de borrarla,
        // para que ese inventario no quede perdido para siempre.
        opportunityProductService.releaseAll(id, actingUserEmail);
        opportunityRepository.delete(opportunity);
    }

    private Opportunity getEntityOrThrow(Long id) {
        return opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Oportunidad no encontrada: " + id));
    }
}
