package com.enterprise.crm.service;

import com.enterprise.crm.dto.InvoiceItemResponse;
import com.enterprise.crm.dto.InvoiceLineRequest;
import com.enterprise.crm.dto.InvoiceRequest;
import com.enterprise.crm.dto.InvoiceResponse;
import com.enterprise.crm.entity.Customer;
import com.enterprise.crm.entity.Invoice;
import com.enterprise.crm.entity.InvoiceItem;
import com.enterprise.crm.entity.Product;
import com.enterprise.crm.entity.User;
import com.enterprise.crm.enums.StockMovementReason;
import com.enterprise.crm.exception.ResourceNotFoundException;
import com.enterprise.crm.repository.CustomerRepository;
import com.enterprise.crm.repository.InvoiceItemRepository;
import com.enterprise.crm.repository.InvoiceRepository;
import com.enterprise.crm.repository.ProductRepository;
import com.enterprise.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public List<InvoiceResponse> findAll() {
        return invoiceRepository.findAll().stream()
                .map(this::toResponseWithItems)
                .toList();
    }

    public InvoiceResponse findById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada: " + id));
        return toResponseWithItems(invoice);
    }

    @Transactional
    public InvoiceResponse create(InvoiceRequest request, String actingUserEmail) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + request.getCustomerId()));

        User author = userRepository.findByEmail(actingUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + actingUserEmail));

        // Primero validamos TODAS las lineas antes de tocar stock, para no
        // descontar la mitad de la factura y despues fallar en la ultima linea.
        List<Product> products = new ArrayList<>();
        for (InvoiceLineRequest line : request.getLines()) {
            Product product = productRepository.findById(line.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + line.getProductId()));

            if (product.getQuantityInStock() < line.getQuantity()) {
                throw new IllegalArgumentException(
                        "Stock insuficiente para \"" + product.getName() + "\": quedan "
                                + product.getQuantityInStock() + ", se pidieron " + line.getQuantity());
            }
            products.add(product);
        }

        BigDecimal total = BigDecimal.ZERO;
        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            int quantity = request.getLines().get(i).getQuantity();
            total = total.add(product.getUnitPrice().multiply(BigDecimal.valueOf(quantity)));
        }

        Invoice invoice = Invoice.builder()
                .customer(customer)
                .createdBy(author)
                .total(total)
                .build();
        invoice = invoiceRepository.save(invoice);

        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            int quantity = request.getLines().get(i).getQuantity();

            product.setQuantityInStock(product.getQuantityInStock() - quantity);
            productRepository.save(product);
            productService.logMovement(product, null, -quantity, StockMovementReason.INVOICE_SALE, actingUserEmail);

            invoiceItemRepository.save(InvoiceItem.builder()
                    .invoice(invoice)
                    .product(product)
                    .quantity(quantity)
                    .unitPrice(product.getUnitPrice())
                    .build());
        }

        return toResponseWithItems(invoice);
    }

    private InvoiceResponse toResponseWithItems(Invoice invoice) {
        List<InvoiceItemResponse> items = invoiceItemRepository.findByInvoiceId(invoice.getId()).stream()
                .map(this::toItemResponse)
                .toList();

        Customer customer = invoice.getCustomer();
        String address = (customer.getCity() != null ? customer.getCity() : "")
                + (customer.getCity() != null && customer.getCountry() != null ? ", " : "")
                + (customer.getCountry() != null ? customer.getCountry() : "");

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber("INV-" + String.format("%06d", invoice.getId()))
                .customerId(customer.getId())
                .customerCompanyName(customer.getCompanyName())
                .customerContactName(customer.getContactName())
                .customerEmail(customer.getEmail())
                .customerAddress(address)
                .createdByName(invoice.getCreatedBy().getFirstName() + " " + invoice.getCreatedBy().getLastName())
                .total(invoice.getTotal())
                .issueDate(invoice.getIssueDate())
                .items(items)
                .build();
    }

    private InvoiceItemResponse toItemResponse(InvoiceItem item) {
        return InvoiceItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .sku(item.getProduct().getSku())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .lineTotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .build();
    }
}
