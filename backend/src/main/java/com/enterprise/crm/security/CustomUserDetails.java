package com.enterprise.crm.security;

import com.enterprise.crm.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class CustomUserDetails implements UserDetails {

    private final User user;
    private final Collection<? extends GrantedAuthority> authorities;

    /**
     * OJO: este constructor tiene que llamarse SIEMPRE dentro de una transaccion
     * activa (ver CustomUserDetailsService), porque user.getRole() es un proxy LAZY.
     * Lo resolvemos una sola vez aca, en el constructor, y lo guardamos ya
     * materializado en un SimpleGrantedAuthority. Asi getAuthorities() despues
     * nunca vuelve a tocar el proxy de Hibernate, aunque la sesion ya se haya
     * cerrado (que es exactamente lo que pasa en JwtAuthenticationFilter, donde
     * getAuthorities() se llama fuera de cualquier transaccion).
     */
    public CustomUserDetails(User user) {
        this.user = user;
        this.authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().getName().name())
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.isEnabled();
    }
}
