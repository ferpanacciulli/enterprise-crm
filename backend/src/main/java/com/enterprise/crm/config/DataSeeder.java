package com.enterprise.crm.config;

import com.enterprise.crm.entity.Product;
import com.enterprise.crm.entity.Role;
import com.enterprise.crm.entity.User;
import com.enterprise.crm.enums.RoleName;
import com.enterprise.crm.repository.ProductRepository;
import com.enterprise.crm.repository.RoleRepository;
import com.enterprise.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Siembra datos de prueba en el primer arranque (solo si las tablas estan vacias),
 * asi el frontend tiene algo para mostrar sin tener que cargar todo a mano.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedSampleProducts();
    }

    private void seedAdminUser() {
        if (userRepository.existsByEmail("admin@crm.com")) {
            return;
        }

        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseThrow(() -> new IllegalStateException(
                        "El rol ADMIN no existe: revisa que la migracion V2__seed_roles.sql se haya aplicado"));

        User admin = User.builder()
                .firstName("Admin")
                .lastName("CRM")
                .email("admin@crm.com")
                .password(passwordEncoder.encode("Admin123!"))
                .enabled(true)
                .role(adminRole)
                .build();

        userRepository.save(admin);
        System.out.println(">> Usuario admin de prueba creado: admin@crm.com / Admin123!");
    }

    private void seedSampleProducts() {
        if (productRepository.count() > 0) {
            return;
        }

        productRepository.save(Product.builder()
                .sku("SKU-001")
                .name("Licencia Software Anual")
                .description("Licencia anual del software CRM por usuario")
                .category("Software")
                .unitPrice(new BigDecimal("199.99"))
                .quantityInStock(50)
                .reorderLevel(10)
                .active(true)
                .build());

        productRepository.save(Product.builder()
                .sku("SKU-002")
                .name("Soporte Premium")
                .description("Plan de soporte tecnico premium 24/7")
                .category("Servicios")
                .unitPrice(new BigDecimal("499.00"))
                .quantityInStock(5)
                .reorderLevel(10)
                .active(true)
                .build());

        productRepository.save(Product.builder()
                .sku("SKU-003")
                .name("Capacitacion Onboarding")
                .description("Sesion de capacitacion inicial para nuevos clientes")
                .category("Servicios")
                .unitPrice(new BigDecimal("150.00"))
                .quantityInStock(20)
                .reorderLevel(5)
                .active(true)
                .build());

        System.out.println(">> 3 productos de prueba creados (uno queda en bajo stock a proposito)");
    }
}
