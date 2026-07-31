package repository;

import org.springframework.data.jpa.repository.JpaRepository;

import entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
}