package com.klinikku.backend.doctor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DoctorRequest(
        @NotBlank(message = "Doctor full name is required")
        @Size(max = 120, message = "Doctor full name must be 120 characters or less")
        String fullName,
        @Email(message = "Doctor email must be valid")
        @NotBlank(message = "Doctor email is required")
        String email,
        @NotBlank(message = "Password is required")
        String password,
        @NotBlank(message = "Doctor specialization is required")
        String specialization,
        @NotBlank(message = "Doctor license number is required")
        String licenseNumber) {
}
