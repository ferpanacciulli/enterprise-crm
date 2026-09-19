package com.enterprise.crm.config;

import com.enterprise.crm.entity.Activity;
import com.enterprise.crm.entity.Customer;
import com.enterprise.crm.entity.Invoice;
import com.enterprise.crm.entity.InvoiceItem;
import com.enterprise.crm.entity.Opportunity;
import com.enterprise.crm.entity.OpportunityProduct;
import com.enterprise.crm.entity.Product;
import com.enterprise.crm.entity.Role;
import com.enterprise.crm.entity.StockMovement;
import com.enterprise.crm.entity.User;
import com.enterprise.crm.enums.ActivityType;
import com.enterprise.crm.enums.CustomerStatus;
import com.enterprise.crm.enums.OpportunityStage;
import com.enterprise.crm.enums.RoleName;
import com.enterprise.crm.enums.StockMovementReason;
import com.enterprise.crm.repository.ActivityRepository;
import com.enterprise.crm.repository.CustomerRepository;
import com.enterprise.crm.repository.InvoiceItemRepository;
import com.enterprise.crm.repository.InvoiceRepository;
import com.enterprise.crm.repository.OpportunityProductRepository;
import com.enterprise.crm.repository.OpportunityRepository;
import com.enterprise.crm.repository.ProductRepository;
import com.enterprise.crm.repository.RoleRepository;
import com.enterprise.crm.repository.StockMovementRepository;
import com.enterprise.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
    private final CustomerRepository customerRepository;
    private final OpportunityRepository opportunityRepository;
    private final ActivityRepository activityRepository;
    private final OpportunityProductRepository opportunityProductRepository;
    private final StockMovementRepository stockMovementRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        User admin = seedAdminUser();
        List<Product> products = seedSampleProducts();
        List<Customer> customers = seedSampleCustomers();
        List<Opportunity> opportunities = seedSampleOpportunities(customers, admin);
        seedSampleActivities(opportunities, admin);
        seedSampleReservations(opportunities, products, admin);
        seedSampleInvoice(customers, products, admin);
    }

    private User seedAdminUser() {
        User existing = userRepository.findByEmail("admin@crm.com").orElse(null);
        if (existing != null) {
            return existing;
        }

        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseThrow(() -> new IllegalStateException(
                        "El rol ADMIN no existe: revisa que la migracion V1__initial_schema.sql se haya aplicado"));

        User admin = User.builder()
                .firstName("Admin")
                .lastName("CRM")
                .email("admin@crm.com")
                .password(passwordEncoder.encode("Admin123!"))
                .enabled(true)
                .role(adminRole)
                .build();

        admin = userRepository.save(admin);
        System.out.println(">> Usuario admin de prueba creado: admin@crm.com / Admin123!");
        return admin;
    }

    private List<Product> seedSampleProducts() {
        if (productRepository.count() > 0) {
            return productRepository.findAll();
        }

        List<Product> products = List.of(
                productRepository.save(Product.builder()
                        .sku("SKU-001")
                        .name("Licencia Software Anual")
                        .description("Licencia anual del software CRM por usuario")
                        .category("Software")
                        .unitPrice(new BigDecimal("199.99"))
                        .quantityInStock(50)
                        .reorderLevel(10)
                        .active(true)
                        .build()),

                productRepository.save(Product.builder()
                        .sku("SKU-002")
                        .name("Soporte Premium")
                        .description("Plan de soporte tecnico premium 24/7")
                        .category("Servicios")
                        .unitPrice(new BigDecimal("499.00"))
                        .quantityInStock(5)
                        .reorderLevel(10)
                        .active(true)
                        .build()),

                productRepository.save(Product.builder()
                        .sku("SKU-003")
                        .name("Capacitacion Onboarding")
                        .description("Sesion de capacitacion inicial para nuevos clientes")
                        .category("Servicios")
                        .unitPrice(new BigDecimal("150.00"))
                        .quantityInStock(20)
                        .reorderLevel(5)
                        .active(true)
                        .build())
        );

        System.out.println(">> 3 productos de prueba creados (uno queda en bajo stock a proposito)");
        return products;
    }

    private List<Customer> seedSampleCustomers() {
        if (customerRepository.count() > 0) {
            return customerRepository.findAll();
        }

        List<Customer> customers = List.of(
                Customer.builder()
                        .companyName("Acme Corp")
                        .contactName("Juan Pérez")
                        .email("juan.perez@acme.com")
                        .phone("+54 11 4444-1111")
                        .industry("Manufactura")
                        .country("Argentina")
                        .city("Buenos Aires")
                        .status(CustomerStatus.ACTIVE)
                        .build(),
                Customer.builder()
                        .companyName("TechNova SRL")
                        .contactName("María Gómez")
                        .email("maria.gomez@technova.com")
                        .phone("+54 11 4444-2222")
                        .industry("Tecnología")
                        .country("Argentina")
                        .city("Córdoba")
                        .status(CustomerStatus.ACTIVE)
                        .build(),
                Customer.builder()
                        .companyName("Global Logistics")
                        .contactName("Carlos Ruiz")
                        .email("carlos.ruiz@globallog.com")
                        .phone("+54 11 4444-3333")
                        .industry("Logística")
                        .country("Argentina")
                        .city("Rosario")
                        .status(CustomerStatus.LEAD)
                        .build(),
                Customer.builder()
                        .companyName("Norte Alimentos")
                        .contactName("Lucía Fernández")
                        .email("lucia.fernandez@nortealimentos.com")
                        .phone("+54 11 4444-4444")
                        .industry("Alimentación")
                        .country("Argentina")
                        .city("Salta")
                        .status(CustomerStatus.LEAD)
                        .build(),
                Customer.builder()
                        .companyName("Estudio Contable Del Sur")
                        .contactName("Pablo Martínez")
                        .email("pablo.martinez@delsur.com")
                        .phone("+54 11 4444-5555")
                        .industry("Servicios profesionales")
                        .country("Argentina")
                        .city("Mendoza")
                        .status(CustomerStatus.INACTIVE)
                        .build(),
                Customer.builder()
                        .companyName("Retail Plus")
                        .contactName("Sofía López")
                        .email("sofia.lopez@retailplus.com")
                        .phone("+54 11 4444-6666")
                        .industry("Retail")
                        .country("Argentina")
                        .city("La Plata")
                        .status(CustomerStatus.BLOCKED)
                        .build()
        );

        List<Customer> saved = customerRepository.saveAll(customers);
        System.out.println(">> " + saved.size() + " clientes de prueba creados");
        return saved;
    }

    private List<Opportunity> seedSampleOpportunities(List<Customer> customers, User owner) {
        if (opportunityRepository.count() > 0) {
            return opportunityRepository.findAll();
        }
        if (customers.size() < 5) {
            return List.of();
        }

        List<Opportunity> opportunities = List.of(
                Opportunity.builder()
                        .title("Implementación CRM completa")
                        .amount(new BigDecimal("12000.00"))
                        .stage(OpportunityStage.NEGOTIATION)
                        .expectedCloseDate(LocalDate.now().plusDays(15))
                        .customer(customers.get(0))
                        .owner(owner)
                        .build(),
                Opportunity.builder()
                        .title("Renovación de licencias anuales")
                        .amount(new BigDecimal("4500.00"))
                        .stage(OpportunityStage.PROPOSAL)
                        .expectedCloseDate(LocalDate.now().plusDays(30))
                        .customer(customers.get(1))
                        .owner(owner)
                        .build(),
                Opportunity.builder()
                        .title("Plan de soporte premium")
                        .amount(new BigDecimal("6000.00"))
                        .stage(OpportunityStage.QUALIFIED)
                        .expectedCloseDate(LocalDate.now().plusDays(45))
                        .customer(customers.get(2))
                        .owner(owner)
                        .build(),
                Opportunity.builder()
                        .title("Onboarding + capacitación inicial")
                        .amount(new BigDecimal("1500.00"))
                        .stage(OpportunityStage.LEAD)
                        .expectedCloseDate(LocalDate.now().plusDays(60))
                        .customer(customers.get(3))
                        .owner(owner)
                        .build(),
                Opportunity.builder()
                        .title("Ampliación de módulo de inventario")
                        .amount(new BigDecimal("8200.00"))
                        .stage(OpportunityStage.WON)
                        .expectedCloseDate(LocalDate.now().minusDays(5))
                        .customer(customers.get(0))
                        .owner(owner)
                        .build(),
                Opportunity.builder()
                        .title("Migración de datos legacy")
                        .amount(new BigDecimal("3000.00"))
                        .stage(OpportunityStage.LOST)
                        .expectedCloseDate(LocalDate.now().minusDays(10))
                        .customer(customers.get(4))
                        .owner(owner)
                        .build()
        );

        List<Opportunity> saved = opportunityRepository.saveAll(opportunities);
        System.out.println(">> " + saved.size() + " oportunidades de prueba creadas");
        return saved;
    }

    private void seedSampleActivities(List<Opportunity> opportunities, User author) {
        if (activityRepository.count() > 0 || opportunities.size() < 2) {
            return;
        }

        Opportunity first = opportunities.get(0);
        Opportunity second = opportunities.get(1);

        List<Activity> activities = List.of(
                Activity.builder()
                        .type(ActivityType.CALL)
                        .description("Llamada inicial: el cliente pidió una demo del módulo de reportes.")
                        .activityDate(LocalDateTime.now().minusDays(6))
                        .opportunity(first)
                        .createdBy(author)
                        .build(),
                Activity.builder()
                        .type(ActivityType.EMAIL)
                        .description("Se envió propuesta comercial con el detalle de precios por usuario.")
                        .activityDate(LocalDateTime.now().minusDays(4))
                        .opportunity(first)
                        .createdBy(author)
                        .build(),
                Activity.builder()
                        .type(ActivityType.MEETING)
                        .description("Reunión de negociación: el cliente pidió un 10% de descuento por pago anual.")
                        .activityDate(LocalDateTime.now().minusDays(1))
                        .opportunity(first)
                        .createdBy(author)
                        .build(),
                Activity.builder()
                        .type(ActivityType.NOTE)
                        .description("Cliente todavía evaluando internamente, hacer seguimiento la próxima semana.")
                        .activityDate(LocalDateTime.now().minusDays(2))
                        .opportunity(second)
                        .createdBy(author)
                        .build()
        );

        activityRepository.saveAll(activities);
        System.out.println(">> " + activities.size() + " mensajes/interacciones de prueba creados");
    }

    private void seedSampleReservations(List<Opportunity> opportunities, List<Product> products, User actor) {
        if (opportunityProductRepository.count() > 0 || opportunities.size() < 2 || products.size() < 3) {
            return;
        }

        Opportunity first = opportunities.get(0);
        Opportunity second = opportunities.get(1);
        Product license = products.get(0); // SKU-001
        Product training = products.get(2); // SKU-003

        reserve(first, license, 2, actor);
        reserve(second, training, 3, actor);

        System.out.println(">> 2 reservas de producto de prueba creadas (con su descuento de stock ya aplicado)");
    }

    private void reserve(Opportunity opportunity, Product product, int quantity, User actor) {
        product.setQuantityInStock(product.getQuantityInStock() - quantity);
        productRepository.save(product);

        opportunityProductRepository.save(OpportunityProduct.builder()
                .opportunity(opportunity)
                .product(product)
                .quantity(quantity)
                .unitPrice(product.getUnitPrice())
                .build());

        stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .opportunity(opportunity)
                .quantityChange(-quantity)
                .reason(StockMovementReason.OPPORTUNITY_RESERVE)
                .performedBy(actor)
                .build());
    }

    private void seedSampleInvoice(List<Customer> customers, List<Product> products, User actor) {
        if (invoiceRepository.count() > 0 || customers.isEmpty() || products.size() < 2) {
            return;
        }

        Customer customer = customers.get(1);
        Product license = products.get(0); // SKU-001, 2 unidades
        Product support = products.get(1); // SKU-002, 1 unidad

        BigDecimal total = license.getUnitPrice().multiply(BigDecimal.valueOf(2))
                .add(support.getUnitPrice().multiply(BigDecimal.valueOf(1)));

        Invoice invoice = invoiceRepository.save(Invoice.builder()
                .customer(customer)
                .createdBy(actor)
                .total(total)
                .build());

        saveInvoiceLine(invoice, license, 2, actor);
        saveInvoiceLine(invoice, support, 1, actor);

        System.out.println(">> 1 factura de prueba creada (INV-" + String.format("%06d", invoice.getId()) + ")");
    }

    private void saveInvoiceLine(Invoice invoice, Product product, int quantity, User actor) {
        product.setQuantityInStock(product.getQuantityInStock() - quantity);
        productRepository.save(product);

        invoiceItemRepository.save(InvoiceItem.builder()
                .invoice(invoice)
                .product(product)
                .quantity(quantity)
                .unitPrice(product.getUnitPrice())
                .build());

        stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .quantityChange(-quantity)
                .reason(StockMovementReason.INVOICE_SALE)
                .performedBy(actor)
                .build());
    }
}
