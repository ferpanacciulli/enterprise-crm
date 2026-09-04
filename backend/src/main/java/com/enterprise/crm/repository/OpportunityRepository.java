package com.enterprise.crm.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.enterprise.crm.entity.Opportunity;

public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {
    
}
