package repository;

import org.springframework.data.jpa.repository.JpaRepository;

import entity.Activity;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    
}