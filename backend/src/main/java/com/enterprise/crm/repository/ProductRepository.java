package com.enterprise.crm.repository;

import com.enterprise.crm.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySku(String sku);

    @Query("SELECT p FROM Product p WHERE p.quantityInStock <= p.reorderLevel AND p.active = true")
    List<Product> findLowStock();
}
