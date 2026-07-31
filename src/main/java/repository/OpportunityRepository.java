package repository;

import org.springframework.data.jpa.repository.JpaRepository;

import entity.Opportunity;

public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {
    
}