package com.klinikku.backend.auth;

import com.klinikku.backend.user.User;
import com.klinikku.backend.user.UserRepository;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String sessionCookieName;
    private final boolean sessionCookieSecure;
    private final String sessionCookieSameSite;
    private final Duration sessionTtl;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.auth.session-cookie-name}") String sessionCookieName,
            @Value("${app.auth.session-cookie-secure}") boolean sessionCookieSecure,
            @Value("${app.auth.session-cookie-same-site}") String sessionCookieSameSite,
            @Value("${app.auth.session-ttl}") Duration sessionTtl) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.sessionCookieName = sessionCookieName;
        this.sessionCookieSecure = sessionCookieSecure;
        this.sessionCookieSameSite = sessionCookieSameSite;
        this.sessionTtl = sessionTtl;
    }

    public LoginResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException());

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        AuthenticatedUser authenticatedUser = AuthenticatedUser.from(user);
        return new LoginResult(jwtService.createToken(authenticatedUser), AuthUserResponse.from(authenticatedUser));
    }

    public ResponseCookie createSessionCookie(String token) {
        return ResponseCookie.from(sessionCookieName, token)
                .httpOnly(true)
                .secure(sessionCookieSecure)
                .sameSite(sessionCookieSameSite)
                .path("/")
                .maxAge(sessionTtl)
                .build();
    }

    public ResponseCookie createLogoutCookie() {
        return ResponseCookie.from(sessionCookieName, "")
                .httpOnly(true)
                .secure(sessionCookieSecure)
                .sameSite(sessionCookieSameSite)
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }
}
