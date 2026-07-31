package repository;

import org.springframework.data.jpa.repository.JpaRepository;

import entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    
}