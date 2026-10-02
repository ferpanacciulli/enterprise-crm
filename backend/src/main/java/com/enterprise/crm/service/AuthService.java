package com.enterprise.crm.service;

import com.enterprise.crm.dto.auth.AuthResponse;
import com.enterprise.crm.dto.auth.LoginRequest;
import com.enterprise.crm.dto.auth.RegisterRequest;
import com.enterprise.crm.entity.Role;
import com.enterprise.crm.entity.User;
import com.enterprise.crm.enums.RoleName;
import com.enterprise.crm.exception.DuplicateResourceException;
import com.enterprise.crm.exception.ResourceNotFoundException;
import com.enterprise.crm.repository.RoleRepository;
import com.enterprise.crm.repository.UserRepository;
import com.enterprise.crm.security.CustomUserDetails;
import com.enterprise.crm.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Ya existe un usuario con ese email");
        }

        // SEGURIDAD: el registro publico NO puede auto-asignarse privilegios.
        // Si el que registra no es ADMIN, cualquier rol pedido en el payload se
        // ignora y se cae al rol por defecto (SALES_REPRESENTATIVE). Antes, un
        // visitante anonimo podia mandar role=ADMIN y crearse una cuenta admin.
        RoleName requested = request.getRole() != null ? request.getRole() : RoleName.SALES_REPRESENTATIVE;
        RoleName roleName = isCurrentUserAdmin() ? requested : RoleName.SALES_REPRESENTATIVE;

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Rol no encontrado: " + roleName));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .enabled(true)
                .role(role)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(new CustomUserDetails(user));
        return buildAuthResponse(user, token);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        String token = jwtService.generateToken(new CustomUserDetails(user));
        return buildAuthResponse(user, token);
    }

    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .role(user.getRole().getName().name())
                .build();
    }
}
