package com.enterprise.crm.mapper;

import com.enterprise.crm.dto.CustomerRequest;
import com.enterprise.crm.dto.CustomerResponse;
import com.enterprise.crm.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.BeanMapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface CustomerMapper {

    Customer toEntity(CustomerRequest request);

    CustomerResponse toResponse(Customer customer);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(CustomerRequest request, @MappingTarget Customer customer);
}