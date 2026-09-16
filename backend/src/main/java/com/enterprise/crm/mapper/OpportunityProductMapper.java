package com.enterprise.crm.mapper;

import com.enterprise.crm.dto.OpportunityProductResponse;
import com.enterprise.crm.entity.OpportunityProduct;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OpportunityProductMapper {

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "sku", source = "product.sku")
    @Mapping(target = "lineTotal", expression = "java(item.getUnitPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())))")
    OpportunityProductResponse toResponse(OpportunityProduct item);
}
