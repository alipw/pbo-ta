package com.klinikku.backend.patient;

import com.klinikku.backend.user.UserRole;
import java.time.Instant;
import java.time.LocalDate;

public record PatientResponse(
        Long id,
        UserRole role,
        String fullName,
        String email,
        String phoneNumber,
        LocalDate dateOfBirth,
        Instant createdAt,
        Instant updatedAt) {

    public static PatientResponse from(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getRole(),
                patient.getFullName(),
                patient.getEmail(),
                patient.getPhoneNumber(),
                patient.getDateOfBirth(),
                patient.getCreatedAt(),
                patient.getUpdatedAt());
    }
}
