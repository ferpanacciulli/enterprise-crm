package com.enterprise.crm.dto;

import com.enterprise.crm.enums.CustomerStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerRequest {

    @NotBlank(message = "El nombre de la empresa es obligatorio")
    private String companyName;

    private String contactName;

    @Email(message = "Email inválido")
    private String email;

    private String phone;
    private String industry;
    private String country;
    private String city;
    private CustomerStatus status;
}