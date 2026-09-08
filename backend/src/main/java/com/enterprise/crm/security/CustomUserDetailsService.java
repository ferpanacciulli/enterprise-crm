package com.enterprise.crm.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.enterprise.crm.entity.User;
import lombok.RequiredArgsConstructor;
import com.enterprise.crm.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository repository;

    // @Transactional es lo que mantiene la sesion de Hibernate abierta mientras
    // se construye CustomUserDetails, para que el proxy LAZY de user.getRole()
    // se pueda resolver dentro del constructor sin explotar.
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user = repository.findByEmail(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + username));

        return new CustomUserDetails(user);
    }
}
