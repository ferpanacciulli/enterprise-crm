package com.enterprise.crm.dto;

import com.enterprise.crm.enums.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActivityRequest {

    @NotNull(message = "El tipo es obligatorio")
    private ActivityType type;

    @NotBlank(message = "La descripción es obligatoria")
    private String description;
}
