package com.enterprise.crm.service;

import com.enterprise.crm.dto.CustomerRequest;
import com.enterprise.crm.dto.CustomerResponse;
import com.enterprise.crm.entity.Customer;
import com.enterprise.crm.exception.ResourceNotFoundException;
import com.enterprise.crm.mapper.CustomerMapper;
import com.enterprise.crm.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;
    private final AuditService auditService;

    public List<CustomerResponse> findAll() {
        return customerRepository.findAll()
                .stream()
                .map(customerMapper::toResponse)
                .toList();
    }

    public CustomerResponse findById(Long id) {
        return customerMapper.toResponse(getEntityOrThrow(id));
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        Customer customer = customerMapper.toEntity(request);
        Customer saved = customerRepository.save(customer);
        auditService.record("Customer", saved.getId(), "CREATE",
                "Alta de cliente: " + saved.getCompanyName());
        return customerMapper.toResponse(saved);
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = getEntityOrThrow(id);
        customerMapper.updateEntityFromRequest(request, customer);
        Customer saved = customerRepository.save(customer);
        auditService.record("Customer", saved.getId(), "UPDATE",
                "Edición de cliente: " + saved.getCompanyName());
        return customerMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Customer customer = getEntityOrThrow(id);
        auditService.record("Customer", customer.getId(), "DELETE",
                "Baja de cliente: " + customer.getCompanyName());
        customerRepository.delete(customer);
    }

    private Customer getEntityOrThrow(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer no encontrado: " + id));
    }
}