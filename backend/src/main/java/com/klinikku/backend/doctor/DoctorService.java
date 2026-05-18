package com.klinikku.backend.doctor;

import com.klinikku.backend.common.ResourceNotFoundException;
import com.klinikku.backend.user.UserRole;
import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    public DoctorService(DoctorRepository doctorRepository, PasswordEncoder passwordEncoder) {
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> findAll() {
        return doctorRepository.findAll(Sort.by(Sort.Direction.ASC, "fullName")).stream()
                .map(DoctorResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Doctor findById(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", doctorId));
    }

    @Transactional
    public DoctorResponse create(DoctorRequest request) {
        Doctor doctor = new Doctor();
        doctor.setRole(UserRole.DOCTOR);
        applyRequest(doctor, request);

        return DoctorResponse.from(doctorRepository.save(doctor));
    }

    @Transactional
    public DoctorResponse update(Long doctorId, DoctorRequest request) {
        Doctor doctor = findById(doctorId);
        applyRequest(doctor, request);

        return DoctorResponse.from(doctorRepository.save(doctor));
    }

    @Transactional
    public void deleteById(Long doctorId) {
        Doctor doctor = findById(doctorId);
        doctorRepository.delete(doctor);
    }

    private void applyRequest(Doctor doctor, DoctorRequest request) {
        ensureLicenseNumberIsAvailable(doctor, request.licenseNumber());
        doctor.setFullName(request.fullName());
        doctor.setEmail(request.email());
        doctor.setPasswordHash(passwordEncoder.encode(request.password()));
        doctor.setSpecialization(request.specialization());
        doctor.setLicenseNumber(request.licenseNumber());
    }

    private void ensureLicenseNumberIsAvailable(Doctor doctor, String licenseNumber) {
        doctorRepository.findByLicenseNumber(licenseNumber)
                .filter(existingDoctor -> !Objects.equals(existingDoctor.getId(), doctor.getId()))
                .ifPresent(existingDoctor -> {
                    throw new IllegalArgumentException("Doctor license number is already registered");
                });
    }
}
