package com.klinikku.backend.auth;

import com.klinikku.backend.user.User;
import com.klinikku.backend.user.UserRole;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public record AuthenticatedUser(
        Long id,
        UserRole role,
        String fullName,
        String email) {

    public static AuthenticatedUser from(User user) {
        return new AuthenticatedUser(user.getId(), user.getRole(), user.getFullName(), user.getEmail());
    }

    public Collection<? extends GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
}
