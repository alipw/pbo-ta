package com.klinikku.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.klinikku.backend.user.UserRepository;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

    @Test
    void createLogoutCookieExpiresSessionCookie() {
        AuthService authService = new AuthService(
                mock(UserRepository.class),
                mock(PasswordEncoder.class),
                mock(JwtService.class),
                "session",
                true,
                "Lax",
                Duration.ofHours(8));

        ResponseCookie cookie = authService.createLogoutCookie();

        assertThat(cookie.getName()).isEqualTo("session");
        assertThat(cookie.getValue()).isEmpty();
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.isSecure()).isTrue();
        assertThat(cookie.getSameSite()).isEqualTo("Lax");
        assertThat(cookie.getPath()).isEqualTo("/");
        assertThat(cookie.getMaxAge()).isEqualTo(Duration.ZERO);
    }
}
