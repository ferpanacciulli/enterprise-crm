package com.enterprise.crm.service;

import com.enterprise.crm.dto.AuditLogResponse;
import com.enterprise.crm.entity.AuditLog;
import com.enterprise.crm.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

/**
 * Registra quien hizo que y cuando sobre las entidades sensibles.
 *
 * Pensado para llamarse desde los services de negocio (Customer, Product,
 * Invoice, Opportunity). El username y la IP salen del contexto de la request
 * en curso, asi que quien llama no tiene que pasarlos a mano.
 *
 * Usa REQUIRES_NEW para que el evento quede persistido aunque la transaccion
 * de negocio que lo disparo se revierta despues (ej: un create que falla en la
 * ultima validacion). Un log de auditoria que se pierde justo cuando algo sale
 * mal no sirve de nada.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String entityName, Long entityId, String action, String details) {
        try {
            AuditLog entry = AuditLog.builder()
                    .entityName(entityName)
                    .entityId(entityId)
                    .action(action)
                    .username(currentUsername())
                    .ipAddress(currentIpAddress())
                    .details(details)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception ex) {
            // La auditoria nunca debe tumbar la operacion de negocio.
            log.warn("No se pudo registrar el audit log para {} {}: {}",
                    entityName, action, ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> findRecent(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 500);
        return auditLogRepository
                .findAll(PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditLogResponse toResponse(AuditLog a) {
        return AuditLogResponse.builder()
                .id(a.getId())
                .entityName(a.getEntityName())
                .entityId(a.getEntityId())
                .action(a.getAction())
                .username(a.getUsername())
                .ipAddress(a.getIpAddress())
                .details(a.getDetails())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return "anonymous";
        }
        return auth.getName();
    }

    private String currentIpAddress() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) {
                return null;
            }
            HttpServletRequest request = attrs.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                // Puede venir como "cliente, proxy1, proxy2": nos quedamos con el primero.
                return forwarded.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        } catch (Exception ex) {
            return null;
        }
    }
}
