package com.enterprise.crm.service;

import com.enterprise.crm.dto.ProductRequest;
import com.enterprise.crm.dto.ProductResponse;
import com.enterprise.crm.dto.StockMovementResponse;
import com.enterprise.crm.entity.Product;
import com.enterprise.crm.entity.StockMovement;
import com.enterprise.crm.entity.User;
import com.enterprise.crm.enums.StockMovementReason;
import com.enterprise.crm.exception.DuplicateResourceException;
import com.enterprise.crm.exception.ResourceNotFoundException;
import com.enterprise.crm.mapper.ProductMapper;
import com.enterprise.crm.repository.ProductRepository;
import com.enterprise.crm.repository.StockMovementRepository;
import com.enterprise.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;
    private final ProductMapper productMapper;
    private final AuditService auditService;

    public List<ProductResponse> findAll(String search) {
        List<Product> products = (search == null || search.isBlank())
                ? productRepository.findAll()
                : productRepository.search(search.trim());
        return products.stream().map(productMapper::toResponse).toList();
    }

    public ProductResponse findById(Long id) {
        return productMapper.toResponse(getEntityOrThrow(id));
    }

    public List<ProductResponse> findLowStock() {
        return productRepository.findLowStock().stream().map(productMapper::toResponse).toList();
    }

    public List<StockMovementResponse> findStockMovements(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Producto no encontrado: " + productId);
        }
        return stockMovementRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::toMovementResponse)
                .toList();
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
        Product saved = productRepository.save(product);
        auditService.record("Product", saved.getId(), "CREATE",
                "Alta de producto: " + saved.getName() + " (SKU " + saved.getSku() + ")");
        return productMapper.toResponse(saved);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getEntityOrThrow(id);
        productMapper.updateEntityFromRequest(request, product);
        Product saved = productRepository.save(product);
        auditService.record("Product", saved.getId(), "UPDATE",
                "Edición de producto: " + saved.getName());
        return productMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Product product = getEntityOrThrow(id);
        auditService.record("Product", product.getId(), "DELETE",
                "Baja de producto: " + product.getName());
        productRepository.delete(product);
    }

    @Transactional
    public ProductResponse adjustStock(Long id, int delta, String actingUserEmail) {
        Product product = getEntityOrThrow(id);
        int newQuantity = product.getQuantityInStock() + delta;

        if (newQuantity < 0) {
            throw new IllegalArgumentException(
                    "No hay stock suficiente: quedan " + product.getQuantityInStock()
                            + ", se intento descontar " + Math.abs(delta));
        }

        product.setQuantityInStock(newQuantity);
        productRepository.save(product);

        logMovement(product, null, delta, StockMovementReason.MANUAL_ADJUSTMENT, actingUserEmail);

        auditService.record("Product", product.getId(), "STOCK_ADJUST",
                "Ajuste manual de stock: " + (delta >= 0 ? "+" : "") + delta
                        + " -> " + newQuantity + " unidades");

        return productMapper.toResponse(product);
    }

    /**
     * Usado por OpportunityProductService para loguear las reservas/liberaciones
     * automaticas de stock (el ajuste de cantidad ya lo hace ese service).
     */
    @Transactional
    public void logMovement(Product product, com.enterprise.crm.entity.Opportunity opportunity,
                             int quantityChange, StockMovementReason reason, String actingUserEmail) {
        User actor = userRepository.findByEmail(actingUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + actingUserEmail));

        StockMovement movement = StockMovement.builder()
                .product(product)
                .opportunity(opportunity)
                .quantityChange(quantityChange)
                .reason(reason)
                .performedBy(actor)
                .build();

        stockMovementRepository.save(movement);
    }

    private StockMovementResponse toMovementResponse(StockMovement m) {
        return StockMovementResponse.builder()
                .id(m.getId())
                .quantityChange(m.getQuantityChange())
                .reason(m.getReason())
                .opportunityId(m.getOpportunity() != null ? m.getOpportunity().getId() : null)
                .opportunityTitle(m.getOpportunity() != null ? m.getOpportunity().getTitle() : null)
                .performedByName(m.getPerformedBy().getFirstName() + " " + m.getPerformedBy().getLastName())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private Product getEntityOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
    }
}
