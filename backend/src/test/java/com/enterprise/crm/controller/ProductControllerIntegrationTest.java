package com.enterprise.crm.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ProductControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    /** Se registra un usuario nuevo por test y devuelve su token, para no depender del admin sembrado. */
    private String obtenerToken(String email) {
        Map<String, Object> registerBody = Map.of(
                "firstName", "Test",
                "lastName", "User",
                "email", email,
                "password", "password123"
        );
        ResponseEntity<Map> response = restTemplate.postForEntity(url("/auth/register"), registerBody, Map.class);
        return (String) response.getBody().get("token");
    }

    private HttpHeaders authHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    @Test
    void crearProducto_yLuegoAjustarStockDeMas_devuelve400() {
        String token = obtenerToken("product-test-1@crm.com");

        Map<String, Object> productBody = Map.of(
                "sku", "SKU-INTEGRATION-1",
                "name", "Producto de integracion",
                "unitPrice", 50.0,
                "quantityInStock", 5,
                "reorderLevel", 2
        );

        ResponseEntity<Map> createResponse = restTemplate.exchange(
                url("/api/products"), HttpMethod.POST,
                new HttpEntity<>(productBody, authHeaders(token)), Map.class);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Number productId = (Number) createResponse.getBody().get("id");

        // Intentamos descontar mas de lo que hay -> 400, no 500
        Map<String, Object> stockBody = Map.of("delta", -100);
        ResponseEntity<Map> adjustResponse = restTemplate.exchange(
                url("/api/products/" + productId + "/stock"), HttpMethod.PATCH,
                new HttpEntity<>(stockBody, authHeaders(token)), Map.class);

        assertThat(adjustResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat((String) adjustResponse.getBody().get("message")).contains("stock suficiente");
    }

    @Test
    void crearProductoConSkuDuplicado_devuelve409() {
        String token = obtenerToken("product-test-2@crm.com");

        Map<String, Object> productBody = Map.of(
                "sku", "SKU-INTEGRATION-DUP",
                "name", "Producto duplicado",
                "unitPrice", 10.0,
                "quantityInStock", 1,
                "reorderLevel", 1
        );

        restTemplate.exchange(url("/api/products"), HttpMethod.POST,
                new HttpEntity<>(productBody, authHeaders(token)), Map.class);

        ResponseEntity<Map> secondAttempt = restTemplate.exchange(
                url("/api/products"), HttpMethod.POST,
                new HttpEntity<>(productBody, authHeaders(token)), Map.class);

        assertThat(secondAttempt.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void crearProductoSinNombre_devuelve400ConDetalleDeCampo() {
        String token = obtenerToken("product-test-3@crm.com");

        Map<String, Object> invalidBody = Map.of(
                "sku", "SKU-SIN-NOMBRE",
                "name", "",
                "unitPrice", 10.0,
                "quantityInStock", 1,
                "reorderLevel", 1
        );

        ResponseEntity<Map> response = restTemplate.exchange(
                url("/api/products"), HttpMethod.POST,
                new HttpEntity<>(invalidBody, authHeaders(token)), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        Map<String, Object> fieldErrors = (Map<String, Object>) response.getBody().get("fieldErrors");
        assertThat(fieldErrors).containsKey("name");
    }

    @Test
    void listarProductos_conTokenValido_devuelve200() {
        String token = obtenerToken("product-test-4@crm.com");

        ResponseEntity<List> response = restTemplate.exchange(
                url("/api/products"), HttpMethod.GET,
                new HttpEntity<>(authHeaders(token)), List.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
