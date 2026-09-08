package com.enterprise.crm.mapper;

import com.enterprise.crm.dto.OpportunityRequest;
import com.enterprise.crm.dto.OpportunityResponse;
import com.enterprise.crm.entity.Opportunity;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface OpportunityMapper {

    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "owner", ignore = true)
    Opportunity toEntity(OpportunityRequest request);

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", source = "customer.companyName")
    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "ownerName", expression = "java(opportunity.getOwner().getFirstName() + \" \" + opportunity.getOwner().getLastName())")
    OpportunityResponse toResponse(Opportunity opportunity);

    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(OpportunityRequest request, @MappingTarget Opportunity opportunity);
}
