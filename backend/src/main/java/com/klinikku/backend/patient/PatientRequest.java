package com.klinikku.backend.patient;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record PatientRequest(
        @NotBlank(message = "Patient full name is required")
        String fullName,
        @Email(message = "Patient email must be valid")
        @NotBlank(message = "Patient email is required")
        String email,
        @NotBlank(message = "Password is required")
        String password,
        @NotBlank(message = "Patient phone number is required")
        String phoneNumber,
        LocalDate dateOfBirth) {
}
