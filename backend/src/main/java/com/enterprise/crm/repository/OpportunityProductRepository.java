package com.enterprise.crm.repository;

import com.enterprise.crm.entity.OpportunityProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OpportunityProductRepository extends JpaRepository<OpportunityProduct, Long> {
    List<OpportunityProduct> findByOpportunityId(Long opportunityId);
}
