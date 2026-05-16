package com.klinikku.backend.doctor;

import com.klinikku.backend.user.UserRole;
import java.time.Instant;

public record DoctorResponse(
        Long id,
        UserRole role,
        String fullName,
        String email,
        String specialization,
        String licenseNumber,
        Instant createdAt,
        Instant updatedAt) {

    public static DoctorResponse from(Doctor doctor) {
        return new DoctorResponse(
                doctor.getId(),
                doctor.getRole(),
                doctor.getFullName(),
                doctor.getEmail(),
                doctor.getSpecialization(),
                doctor.getLicenseNumber(),
                doctor.getCreatedAt(),
                doctor.getUpdatedAt());
    }
}
