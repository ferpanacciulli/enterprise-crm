package com.enterprise.crm.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductRequest {

    @NotBlank(message = "El SKU es obligatorio")
    private String sku;

    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    private String description;
    private String category;

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0")
    private BigDecimal unitPrice;

    @NotNull
    @Min(value = 0, message = "El stock no puede ser negativo")
    private Integer quantityInStock;

    @NotNull
    @Min(value = 0)
    private Integer reorderLevel;

    private Boolean active;
}
