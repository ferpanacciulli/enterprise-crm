package repository;

import org.springframework.data.jpa.repository.JpaRepository;

import entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

}