package com.enterprise.crm.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test de integracion real: levanta el contexto completo de Spring (Security,
 * JPA, Flyway) contra un H2 en memoria propio de los tests (application-test.yml),
 * y pega HTTP de verdad contra los endpoints - no mockeamos nada aca.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    @Test
    void registrarse_yLuegoLoguearse_devuelveTokenEnAmbosCasos() {
        Map<String, Object> registerBody = Map.of(
                "firstName", "Test",
                "lastName", "User",
                "email", "integration-test@crm.com",
                "password", "password123"
        );

        ResponseEntity<Map> registerResponse = restTemplate.postForEntity(url("/auth/register"), registerBody, Map.class);

        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registerResponse.getBody()).containsKey("token");
        assertThat(registerResponse.getBody().get("role")).isEqualTo("SALES_REPRESENTATIVE");

        Map<String, Object> loginBody = Map.of(
                "email", "integration-test@crm.com",
                "password", "password123"
        );

        ResponseEntity<Map> loginResponse = restTemplate.postForEntity(url("/auth/login"), loginBody, Map.class);

        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).containsKey("token");
    }

    @Test
    void registrarseDosVecesConElMismoEmail_devuelve409() {
        Map<String, Object> body = Map.of(
                "firstName", "Dup",
                "lastName", "User",
                "email", "duplicado@crm.com",
                "password", "password123"
        );

        restTemplate.postForEntity(url("/auth/register"), body, Map.class);
        ResponseEntity<Map> secondAttempt = restTemplate.postForEntity(url("/auth/register"), body, Map.class);

        assertThat(secondAttempt.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void loginConContraseñaIncorrecta_devuelve401() {
        Map<String, Object> registerBody = Map.of(
                "firstName", "Wrong",
                "lastName", "Pass",
                "email", "wrongpass@crm.com",
                "password", "password123"
        );
        restTemplate.postForEntity(url("/auth/register"), registerBody, Map.class);

        Map<String, Object> loginBody = Map.of(
                "email", "wrongpass@crm.com",
                "password", "contraseña-incorrecta"
        );

        ResponseEntity<Map> response = restTemplate.postForEntity(url("/auth/login"), loginBody, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void endpointProtegido_sinToken_devuelve401() {
        ResponseEntity<Map> response = restTemplate.getForEntity(url("/api/customers"), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
