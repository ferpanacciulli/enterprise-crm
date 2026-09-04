package com.enterprise.crm.mapper;

import com.enterprise.crm.dto.ProductRequest;
import com.enterprise.crm.dto.ProductResponse;
import com.enterprise.crm.entity.Product;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    Product toEntity(ProductRequest request);

    @Mapping(target = "lowStock", expression = "java(product.getQuantityInStock() <= product.getReorderLevel())")
    ProductResponse toResponse(Product product);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(ProductRequest request, @MappingTarget Product product);
}
