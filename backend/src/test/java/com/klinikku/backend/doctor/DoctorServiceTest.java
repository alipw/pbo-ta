package com.klinikku.backend.doctor;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class DoctorServiceTest {

    private final DoctorRepository doctorRepository = org.mockito.Mockito.mock(DoctorRepository.class);
    private final PasswordEncoder passwordEncoder = org.mockito.Mockito.mock(PasswordEncoder.class);
    private final DoctorService doctorService = new DoctorService(doctorRepository, passwordEncoder);

    @Test
    void createRejectsDuplicateLicenseNumberBeforeSave() {
        Doctor existingDoctor = doctorWithId(1L);
        DoctorRequest request = requestWithLicense("STR-123");
        when(doctorRepository.findByLicenseNumber("STR-123")).thenReturn(Optional.of(existingDoctor));

        assertThatThrownBy(() -> doctorService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Doctor license number is already registered");

        verify(doctorRepository, never()).save(any(Doctor.class));
    }

    @Test
    void updateAllowsDoctorToKeepOwnLicenseNumber() {
        Doctor doctor = doctorWithId(1L);
        DoctorRequest request = requestWithLicense("STR-123");
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.findByLicenseNumber("STR-123")).thenReturn(Optional.of(doctor));
        when(passwordEncoder.encode("secret")).thenReturn("encoded-secret");
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        doctorService.update(1L, request);

        verify(doctorRepository).save(doctor);
    }

    @Test
    void updateRejectsLicenseNumberOwnedByAnotherDoctorBeforeSave() {
        Doctor doctor = doctorWithId(1L);
        Doctor existingDoctor = doctorWithId(2L);
        DoctorRequest request = requestWithLicense("STR-123");
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.findByLicenseNumber("STR-123")).thenReturn(Optional.of(existingDoctor));

        assertThatThrownBy(() -> doctorService.update(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Doctor license number is already registered");

        verify(doctorRepository, never()).save(any(Doctor.class));
    }

    private DoctorRequest requestWithLicense(String licenseNumber) {
        return new DoctorRequest(
                "Dr. Test",
                "doctor@example.com",
                "secret",
                "General Medicine",
                licenseNumber);
    }

    private Doctor doctorWithId(Long id) {
        Doctor doctor = new Doctor();
        ReflectionTestUtils.setField(doctor, "id", id);
        return doctor;
    }
}
