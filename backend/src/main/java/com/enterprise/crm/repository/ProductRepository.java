package com.enterprise.crm.repository;

import com.enterprise.crm.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySku(String sku);

    @Query("SELECT p FROM Product p WHERE p.quantityInStock <= p.reorderLevel AND p.active = true")
    List<Product> findLowStock();

    @Query("SELECT p FROM Product p WHERE "
            + "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(p.category) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Product> search(@Param("search") String search);
}
