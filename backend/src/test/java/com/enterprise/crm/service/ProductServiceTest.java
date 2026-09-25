package com.enterprise.crm.service;

import com.enterprise.crm.dto.ProductRequest;
import com.enterprise.crm.entity.Product;
import com.enterprise.crm.entity.User;
import com.enterprise.crm.exception.DuplicateResourceException;
import com.enterprise.crm.exception.ResourceNotFoundException;
import com.enterprise.crm.mapper.ProductMapper;
import com.enterprise.crm.repository.ProductRepository;
import com.enterprise.crm.repository.StockMovementRepository;
import com.enterprise.crm.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios puros (sin contexto de Spring): mockeamos los repositorios
 * y el mapper, y probamos solo la logica de negocio del service.
 */
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private ProductService productService;

    private Product product;

    @BeforeEach
    void setUp() {
        product = Product.builder()
                .id(1L)
                .sku("SKU-TEST")
                .name("Producto de prueba")
                .unitPrice(new BigDecimal("100.00"))
                .quantityInStock(5)
                .reorderLevel(2)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("adjustStock: descontar mas de lo que hay tira IllegalArgumentException y no toca la base")
    void adjustStock_stockInsuficiente_tiraExcepcion() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.adjustStock(1L, -10, "admin@crm.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No hay stock suficiente");

        verify(productRepository, never()).save(any());
        verify(stockMovementRepository, never()).save(any());
    }

    @Test
    @DisplayName("adjustStock: un descuento valido actualiza el stock y registra el movimiento")
    void adjustStock_stockSuficiente_actualizaYRegistraMovimiento() {
        User actor = User.builder().id(9L).firstName("Admin").lastName("CRM").build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findByEmail("admin@crm.com")).thenReturn(Optional.of(actor));

        productService.adjustStock(1L, -3, "admin@crm.com");

        assertThat(product.getQuantityInStock()).isEqualTo(2);
        verify(productRepository).save(product);
        verify(stockMovementRepository).save(any());
    }

    @Test
    @DisplayName("adjustStock: producto inexistente tira ResourceNotFoundException")
    void adjustStock_productoInexistente_tiraResourceNotFound() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.adjustStock(99L, 1, "admin@crm.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("create: SKU duplicado tira DuplicateResourceException y no llega a guardar")
    void create_skuDuplicado_tiraExcepcion() {
        ProductRequest request = new ProductRequest();
        request.setSku("SKU-TEST");

        when(productRepository.existsBySku("SKU-TEST")).thenReturn(true);

        assertThatThrownBy(() -> productService.create(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("SKU-TEST");

        verify(productRepository, never()).save(any());
    }
}
