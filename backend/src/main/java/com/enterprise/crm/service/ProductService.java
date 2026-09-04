package com.enterprise.crm.service;

import com.enterprise.crm.dto.ProductRequest;
import com.enterprise.crm.dto.ProductResponse;
import com.enterprise.crm.entity.Product;
import com.enterprise.crm.exception.DuplicateResourceException;
import com.enterprise.crm.exception.ResourceNotFoundException;
import com.enterprise.crm.mapper.ProductMapper;
import com.enterprise.crm.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public List<ProductResponse> findAll() {
        return productRepository.findAll().stream().map(productMapper::toResponse).toList();
    }

    public ProductResponse findById(Long id) {
        return productMapper.toResponse(getEntityOrThrow(id));
    }

    public List<ProductResponse> findLowStock() {
        return productRepository.findLowStock().stream().map(productMapper::toResponse).toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("Ya existe un producto con el SKU: " + request.getSku());
        }
        Product product = productMapper.toEntity(request);
        if (request.getActive() == null) {
            product.setActive(true);
        }
        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getEntityOrThrow(id);
        productMapper.updateEntityFromRequest(request, product);
        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        productRepository.delete(getEntityOrThrow(id));
    }

    @Transactional
    public ProductResponse adjustStock(Long id, int delta) {
        Product product = getEntityOrThrow(id);
        int newQuantity = product.getQuantityInStock() + delta;

        if (newQuantity < 0) {
            throw new IllegalArgumentException(
                    "No hay stock suficiente: quedan " + product.getQuantityInStock()
                            + ", se intento descontar " + Math.abs(delta));
        }

        product.setQuantityInStock(newQuantity);
        return productMapper.toResponse(productRepository.save(product));
    }

    private Product getEntityOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
    }
}
