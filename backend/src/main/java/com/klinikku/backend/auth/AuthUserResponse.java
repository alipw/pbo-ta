package com.klinikku.backend.auth;

import com.klinikku.backend.user.UserRole;

public record AuthUserResponse(
        Long id,
        UserRole role,
        String fullName,
        String email) {

    public static AuthUserResponse from(AuthenticatedUser user) {
        return new AuthUserResponse(user.id(), user.role(), user.fullName(), user.email());
    }
}
