package com.enterprise.crm.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OpportunityProductRequest {

    @NotNull(message = "Tenés que elegir un producto")
    private Long productId;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad tiene que ser al menos 1")
    private Integer quantity;
}
