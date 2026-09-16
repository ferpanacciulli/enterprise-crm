package com.enterprise.crm.controller;

import com.enterprise.crm.dto.ProductRequest;
import com.enterprise.crm.dto.ProductResponse;
import com.enterprise.crm.dto.StockMovementResponse;
import com.enterprise.crm.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductResponse> findAll(@RequestParam(required = false) String search) {
        return productService.findAll(search);
    }

    @GetMapping("/low-stock")
    public List<ProductResponse> findLowStock() {
        return productService.findLowStock();
    }

    @GetMapping("/{id}")
    public ProductResponse findById(@PathVariable Long id) {
        return productService.findById(id);
    }

    @GetMapping("/{id}/stock-movements")
    public List<StockMovementResponse> findStockMovements(@PathVariable Long id) {
        return productService.findStockMovements(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @PatchMapping("/{id}/stock")
    public ProductResponse adjustStock(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body,
            Authentication authentication) {
        return productService.adjustStock(id, body.getOrDefault("delta", 0), authentication.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        productService.delete(id);
    }
}
