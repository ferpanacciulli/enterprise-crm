package service;

import com.enterprise.crm.dto.CustomerRequest;
import com.enterprise.crm.dto.CustomerResponse;
import com.enterprise.crm.entity.Customer;
import exception.ResourceNotFoundException;
import mapper.CustomerMapper;
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
        return customerMapper.toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = getEntityOrThrow(id);
        customerMapper.updateEntityFromRequest(request, customer);
        return customerMapper.toResponse(customerRepository.save(customer));
    }

    @Transactional
    public void delete(Long id) {
        Customer customer = getEntityOrThrow(id);
        customerRepository.delete(customer);
    }

    private Customer getEntityOrThrow(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer no encontrado: " + id));
    }
}