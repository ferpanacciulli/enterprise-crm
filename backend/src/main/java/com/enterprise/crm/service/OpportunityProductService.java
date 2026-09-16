package com.enterprise.crm.service;

import com.enterprise.crm.dto.OpportunityProductRequest;
import com.enterprise.crm.dto.OpportunityProductResponse;
import com.enterprise.crm.entity.Opportunity;
import com.enterprise.crm.entity.OpportunityProduct;
import com.enterprise.crm.entity.Product;
import com.enterprise.crm.enums.StockMovementReason;
import com.enterprise.crm.exception.ResourceNotFoundException;
import com.enterprise.crm.mapper.OpportunityProductMapper;
import com.enterprise.crm.repository.OpportunityProductRepository;
import com.enterprise.crm.repository.OpportunityRepository;
import com.enterprise.crm.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Ata el inventario a las oportunidades: agregar un producto a una oportunidad
 * reserva (descuenta) ese stock al instante; sacarlo o cancelar la oportunidad
 * lo libera (lo devuelve). Cada movimiento queda registrado via ProductService.logMovement.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OpportunityProductService {

    private final OpportunityProductRepository opportunityProductRepository;
    private final OpportunityRepository opportunityRepository;
    private final ProductRepository productRepository;
    private final OpportunityProductMapper opportunityProductMapper;
    private final ProductService productService;

    public List<OpportunityProductResponse> findByOpportunity(Long opportunityId) {
        if (!opportunityRepository.existsById(opportunityId)) {
            throw new ResourceNotFoundException("Oportunidad no encontrada: " + opportunityId);
        }
        return opportunityProductRepository.findByOpportunityId(opportunityId).stream()
                .map(opportunityProductMapper::toResponse)
                .toList();
    }

    @Transactional
    public OpportunityProductResponse addProduct(Long opportunityId, OpportunityProductRequest request, String actingUserEmail) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new ResourceNotFoundException("Oportunidad no encontrada: " + opportunityId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + request.getProductId()));

        int quantity = request.getQuantity();

        if (product.getQuantityInStock() < quantity) {
            throw new IllegalArgumentException(
                    "Stock insuficiente para \"" + product.getName() + "\": quedan "
                            + product.getQuantityInStock() + ", se pidieron " + quantity);
        }

        // Reserva: descuenta el stock del catalogo al instante
        product.setQuantityInStock(product.getQuantityInStock() - quantity);
        productRepository.save(product);
        productService.logMovement(product, opportunity, -quantity, StockMovementReason.OPPORTUNITY_RESERVE, actingUserEmail);

        OpportunityProduct item = OpportunityProduct.builder()
                .opportunity(opportunity)
                .product(product)
                .quantity(quantity)
                .unitPrice(product.getUnitPrice())
                .build();

        return opportunityProductMapper.toResponse(opportunityProductRepository.save(item));
    }

    @Transactional
    public void removeProduct(Long opportunityId, Long itemId, String actingUserEmail) {
        OpportunityProduct item = opportunityProductRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Línea de producto no encontrada: " + itemId));

        if (!item.getOpportunity().getId().equals(opportunityId)) {
            throw new ResourceNotFoundException("Línea de producto no encontrada en esta oportunidad: " + itemId);
        }

        releaseAndDelete(item, actingUserEmail);
    }

    /**
     * Libera TODAS las reservas de una oportunidad (se llama al borrarla), para
     * que el stock no quede perdido para siempre.
     */
    @Transactional
    public void releaseAll(Long opportunityId, String actingUserEmail) {
        List<OpportunityProduct> items = opportunityProductRepository.findByOpportunityId(opportunityId);
        for (OpportunityProduct item : items) {
            releaseAndDelete(item, actingUserEmail);
        }
    }

    private void releaseAndDelete(OpportunityProduct item, String actingUserEmail) {
        Product product = item.getProduct();
        product.setQuantityInStock(product.getQuantityInStock() + item.getQuantity());
        productRepository.save(product);

        productService.logMovement(
                product, item.getOpportunity(), item.getQuantity(),
                StockMovementReason.OPPORTUNITY_RELEASE, actingUserEmail);

        opportunityProductRepository.delete(item);
    }
}
