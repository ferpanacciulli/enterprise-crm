package com.enterprise.crm.dto;

import com.enterprise.crm.enums.OpportunityStage;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class OpportunityRequest {

    @NotBlank(message = "El título es obligatorio")
    private String title;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.0", message = "El monto no puede ser negativo")
    private BigDecimal amount;

    @NotNull(message = "La etapa es obligatoria")
    private OpportunityStage stage;

    private LocalDate expectedCloseDate;

    @NotNull(message = "Tenés que elegir un cliente")
    private Long customerId;
}
