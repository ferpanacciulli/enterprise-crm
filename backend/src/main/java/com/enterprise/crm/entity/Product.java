package com.enterprise.crm.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private String name;

    private String description;
    private String category;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "quantity_in_stock", nullable = false)
    private Integer quantityInStock;

    @Column(name = "reorder_level", nullable = false)
    private Integer reorderLevel;

    @Column(nullable = false)
    private boolean active;

    // Imagen guardada como base64 directo en la base (sin servidor de archivos
    // aparte). Pensado para fotos chicas de producto, no para catalogos con
    // cientos de imagenes de alta resolucion.
    // OJO: sin @Lob a proposito. Con @Lob, Hibernate exige que la columna sea
    // un CLOB real - pero H2 crea una columna TEXT agregada con ALTER TABLE
    // como VARCHAR, no CLOB, y eso rompe la validacion del schema al arrancar
    // ("wrong column type ... found VARCHAR, but expecting CLOB"). Sin @Lob,
    // Hibernate la trata como un String comun, que funciona igual de bien
    // contra una columna TEXT tanto en H2 como en Postgres.
    @Column(name = "image_data", columnDefinition = "TEXT")
    private String imageData;

    @Column(name = "image_content_type", length = 50)
    private String imageContentType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
