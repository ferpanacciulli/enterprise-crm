package com.enterprise.crm.service;

import com.enterprise.crm.dto.auth.RegisterRequest;
import com.enterprise.crm.entity.Role;
import com.enterprise.crm.enums.RoleName;
import com.enterprise.crm.exception.DuplicateResourceException;
import com.enterprise.crm.repository.RoleRepository;
import com.enterprise.crm.repository.UserRepository;
import com.enterprise.crm.security.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("register: email ya registrado tira DuplicateResourceException antes de tocar el rol o guardar")
    void register_emailDuplicado_tiraExcepcion() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Fer");
        request.setLastName("Panacciulli");
        request.setEmail("ya-existe@crm.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("ya-existe@crm.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(roleRepository, never()).findByName(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("register: sin rol explicito, usa SALES_REPRESENTATIVE por default")
    void register_sinRolExplicito_usaSalesRepresentativePorDefault() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Fer");
        request.setLastName("Panacciulli");
        request.setEmail("nuevo@crm.com");
        request.setPassword("password123");
        // sin llamar a request.setRole(...) -> queda null a proposito

        when(userRepository.existsByEmail("nuevo@crm.com")).thenReturn(false);
        when(roleRepository.findByName(RoleName.SALES_REPRESENTATIVE))
                .thenReturn(Optional.empty()); // cortamos aca, solo nos interesa que pida ESTE rol

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(com.enterprise.crm.exception.ResourceNotFoundException.class);
    }
}
