package com.enterprise.crm.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class InvoiceRequest {

    @NotNull(message = "Tenés que elegir un cliente")
    private Long customerId;

    @NotEmpty(message = "La factura necesita al menos un producto")
    @Valid
    private List<InvoiceLineRequest> lines;
}
