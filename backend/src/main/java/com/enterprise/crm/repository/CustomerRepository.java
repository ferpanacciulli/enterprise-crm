package com.enterprise.crm.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.enterprise.crm.entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    
}
