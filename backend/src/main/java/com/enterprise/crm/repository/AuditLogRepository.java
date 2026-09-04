package com.enterprise.crm.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.enterprise.crm.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

}
