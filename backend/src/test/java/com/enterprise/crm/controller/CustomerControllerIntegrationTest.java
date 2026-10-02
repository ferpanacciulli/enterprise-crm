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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Destraba la regla unica de permisos sobre clientes:
 *  - crear/editar esta abierto a los TRES roles (un vendedor tiene que poder
 *    cargar un lead; antes un SALES_REPRESENTATIVE recibia 403),
 *  - el borrado es de ADMIN/MANAGER.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class CustomerControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private HttpHeaders authHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    /** Registra un usuario nuevo (rol por defecto SALES_REPRESENTATIVE) y devuelve su token. */
    private String registrarSalesRep(String email) {
        Map<String, Object> registerBody = Map.of(
                "firstName", "Test",
                "lastName", "User",
                "email", email,
                "password", "password123"
        );
        ResponseEntity<Map> response = restTemplate.postForEntity(url("/auth/register"), registerBody, Map.class);
        return (String) response.getBody().get("token");
    }

    private String obtenerTokenAdmin() {
        Map<String, Object> loginBody = Map.of("email", "admin@crm.com", "password", "Admin123!");
        ResponseEntity<Map> response = restTemplate.postForEntity(url("/auth/login"), loginBody, Map.class);
        return (String) response.getBody().get("token");
    }

    /** Un ADMIN puede crear usuarios con cualquier rol; aca usamos eso para armar un MANAGER. */
    private String crearManager(String email) {
        Map<String, Object> registerBody = Map.of(
                "firstName", "Mgr",
                "lastName", "User",
                "email", email,
                "password", "password123",
                "role", "MANAGER"
        );
        HttpHeaders headers = authHeaders(obtenerTokenAdmin());
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> response = restTemplate.exchange(
                url("/auth/register"), HttpMethod.POST,
                new HttpEntity<>(registerBody, headers), Map.class);
        return (String) response.getBody().get("token");
    }

    private Map<String, Object> customerBody(String companyName) {
        return Map.of(
                "companyName", companyName,
                "email", "contacto@example.com",
                "status", "LEAD"
        );
    }

    private Number crearCliente(String token, String companyName) {
        ResponseEntity<Map> response = restTemplate.exchange(
                url("/api/customers"), HttpMethod.POST,
                new HttpEntity<>(customerBody(companyName), authHeaders(token)), Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return (Number) response.getBody().get("id");
    }

    @Test
    void crearCliente_comoSalesRepresentative_devuelve201() {
        // El fix: un vendedor SIEMPRE tuvo que poder cargar un lead en un CRM.
        String token = registrarSalesRep("sales-crear-cliente@crm.com");

        ResponseEntity<Map> response = restTemplate.exchange(
                url("/api/customers"), HttpMethod.POST,
                new HttpEntity<>(customerBody("Cliente Vendedor"), authHeaders(token)), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat((String) response.getBody().get("companyName")).isEqualTo("Cliente Vendedor");
    }

    @Test
    void eliminarCliente_comoSalesRepresentative_devuelve403() {
        String token = registrarSalesRep("sales-borrar-cliente@crm.com");
        Number id = crearCliente(token, "Cliente SoloLectura");

        // Puede crearlo, pero no borrarlo: el borrado es de ADMIN/MANAGER.
        ResponseEntity<Map> response = restTemplate.exchange(
                url("/api/customers/" + id), HttpMethod.DELETE,
                new HttpEntity<>(authHeaders(token)), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void eliminarCliente_comoAdmin_devuelve204() {
        String adminToken = obtenerTokenAdmin();
        Number id = crearCliente(adminToken, "Cliente Admin");

        ResponseEntity<Map> response = restTemplate.exchange(
                url("/api/customers/" + id), HttpMethod.DELETE,
                new HttpEntity<>(authHeaders(adminToken)), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void eliminarCliente_comoManager_devuelve204() {
        String managerToken = crearManager("manager-borrar-cliente@crm.com");
        Number id = crearCliente(managerToken, "Cliente Manager");

        ResponseEntity<Map> response = restTemplate.exchange(
                url("/api/customers/" + id), HttpMethod.DELETE,
                new HttpEntity<>(authHeaders(managerToken)), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
