package com.enterprise.crm.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 404 - recurso no encontrado por id
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {

        ErrorResponse body = buildBody(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // 409 - recurso duplicado (email, SKU, etc)
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(
            DuplicateResourceException ex, HttpServletRequest request) {

        ErrorResponse body = buildBody(HttpStatus.CONFLICT, ex.getMessage(), request, null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    // 400 - @Valid fallo en un @RequestBody
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
                fieldErrors.put(fe.getField(), fe.getDefaultMessage())
        );

        ErrorResponse body = buildBody(
                HttpStatus.BAD_REQUEST, "Error de validación", request, fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 400 - argumento invalido en tiempo de ejecucion (ej: stock insuficiente)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {

        ErrorResponse body = buildBody(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 401 - login con credenciales incorrectas
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {

        ErrorResponse body = buildBody(
                HttpStatus.UNAUTHORIZED, "Email o contraseña incorrectos", request, null);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    // 409 - viola un constraint de la base (ej: unique)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {

        ErrorResponse body = buildBody(
                HttpStatus.CONFLICT,
                "El recurso ya existe o viola una restricción de datos",
                request, null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    // 403 - autenticado pero sin permiso
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        ErrorResponse body = buildBody(
                HttpStatus.FORBIDDEN, "No tenés permisos para esta operación", request, null);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    // 500 - catch-all
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception ex, HttpServletRequest request) {

        log.error("Error no controlado en {} {}", request.getMethod(), request.getRequestURI(), ex);

        ErrorResponse body = buildBody(
                HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor", request, null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    private ErrorResponse buildBody(
            HttpStatus status, String message, HttpServletRequest request, Map<String, String> fieldErrors) {

        return ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .fieldErrors(fieldErrors)
                .build();
    }
}
