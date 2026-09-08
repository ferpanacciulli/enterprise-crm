package com.enterprise.crm.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.enterprise.crm.entity.Activity;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByOpportunityIdOrderByActivityDateDesc(Long opportunityId);

}
