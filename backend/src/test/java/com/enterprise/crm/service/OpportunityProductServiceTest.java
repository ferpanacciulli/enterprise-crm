package com.enterprise.crm.service;

import com.enterprise.crm.dto.OpportunityProductRequest;
import com.enterprise.crm.entity.Opportunity;
import com.enterprise.crm.entity.OpportunityProduct;
import com.enterprise.crm.entity.Product;
import com.enterprise.crm.mapper.OpportunityProductMapper;
import com.enterprise.crm.repository.OpportunityProductRepository;
import com.enterprise.crm.repository.OpportunityRepository;
import com.enterprise.crm.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Estos son los tests mas importantes del proyecto: la reserva/liberacion de
 * stock es la logica que ata Inventario con Oportunidades, y la que mas
 * dolería si se rompiera silenciosamente.
 */
@ExtendWith(MockitoExtension.class)
class OpportunityProductServiceTest {

    @Mock
    private OpportunityProductRepository opportunityProductRepository;

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OpportunityProductMapper opportunityProductMapper;

    @Mock
    private ProductService productService;

    @InjectMocks
    private OpportunityProductService service;

    private Opportunity opportunity;
    private Product product;

    @BeforeEach
    void setUp() {
        opportunity = Opportunity.builder().id(1L).title("Deal de prueba").build();
        product = Product.builder()
                .id(2L)
                .name("Licencia")
                .unitPrice(new BigDecimal("199.99"))
                .quantityInStock(10)
                .build();
    }

    @Test
    @DisplayName("addProduct: pedir mas stock del que hay tira IllegalArgumentException y no descuenta nada")
    void addProduct_stockInsuficiente_tiraExcepcionYNoDescuenta() {
        OpportunityProductRequest request = new OpportunityProductRequest();
        request.setProductId(2L);
        request.setQuantity(50); // hay 10

        when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
        when(productRepository.findById(2L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> service.addProduct(1L, request, "admin@crm.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Stock insuficiente");

        assertThat(product.getQuantityInStock()).isEqualTo(10); // sin tocar
        verify(productRepository, never()).save(any());
        verify(opportunityProductRepository, never()).save(any());
    }

    @Test
    @DisplayName("addProduct: con stock suficiente, descuenta la cantidad reservada y guarda la linea")
    void addProduct_stockSuficiente_descuentaYGuardaLinea() {
        OpportunityProductRequest request = new OpportunityProductRequest();
        request.setProductId(2L);
        request.setQuantity(4);

        when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
        when(productRepository.findById(2L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        when(opportunityProductRepository.save(any(OpportunityProduct.class))).thenAnswer(inv -> inv.getArgument(0));

        service.addProduct(1L, request, "admin@crm.com");

        assertThat(product.getQuantityInStock()).isEqualTo(6); // 10 - 4
        verify(productService).logMovement(
                eq(product), eq(opportunity), eq(-4),
                eq(com.enterprise.crm.enums.StockMovementReason.OPPORTUNITY_RESERVE), eq("admin@crm.com"));
    }

    @Test
    @DisplayName("removeProduct: libera la cantidad reservada de vuelta al stock")
    void removeProduct_liberaStock() {
        OpportunityProduct item = OpportunityProduct.builder()
                .id(5L)
                .opportunity(opportunity)
                .product(product)
                .quantity(3)
                .unitPrice(product.getUnitPrice())
                .build();

        product.setQuantityInStock(7); // ya con 3 reservados de 10 originales

        when(opportunityProductRepository.findById(5L)).thenReturn(Optional.of(item));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        service.removeProduct(1L, 5L, "admin@crm.com");

        assertThat(product.getQuantityInStock()).isEqualTo(10); // 7 + 3 liberados
        verify(opportunityProductRepository).delete(item);
    }

    @Test
    @DisplayName("removeProduct: si la linea es de otra oportunidad, tira ResourceNotFoundException")
    void removeProduct_lineaDeOtraOportunidad_tiraExcepcion() {
        Opportunity otraOportunidad = Opportunity.builder().id(99L).build();
        OpportunityProduct item = OpportunityProduct.builder()
                .id(5L)
                .opportunity(otraOportunidad)
                .product(product)
                .quantity(3)
                .build();

        when(opportunityProductRepository.findById(5L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> service.removeProduct(1L, 5L, "admin@crm.com"))
                .isInstanceOf(com.enterprise.crm.exception.ResourceNotFoundException.class);

        verify(opportunityProductRepository, never()).delete(any());
    }
}
