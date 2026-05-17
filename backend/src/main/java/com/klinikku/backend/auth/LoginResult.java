package com.klinikku.backend.auth;

record LoginResult(String token, AuthUserResponse user) {
}
