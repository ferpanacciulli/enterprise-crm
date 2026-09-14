package com.enterprise.crm.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .cors(cors -> cors.configurationSource(request -> {
                    var config = new org.springframework.web.cors.CorsConfiguration();
                    config.setAllowedOriginPatterns(java.util.List.of("*"));
                    config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(java.util.List.of("*"));
                    return config;
                }))

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // FIX: el preflight de CORS nunca manda el token Authorization
                        // (el navegador todavia no sabe si el servidor lo va a aceptar).
                        // Sin este permitAll, cualquier OPTIONS caia en anyRequest().authenticated()
                        // y volvia 403 antes de que la peticion real (GET/POST) se intentara siquiera.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/auth/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/actuator/health",
                                "/h2-console/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )

                // La consola de H2 se sirve dentro de un <frame>; sin esto, Spring Security
                // la bloquea con X-Frame-Options: DENY. Solo importa cuando el perfil "h2"
                // tiene la consola habilitada (application-h2.yml) - con el perfil
                // "postgresql" esa ruta ni siquiera existe.
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))

                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
