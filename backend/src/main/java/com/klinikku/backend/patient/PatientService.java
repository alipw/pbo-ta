package com.klinikku.backend.patient;

import com.klinikku.backend.common.ResourceNotFoundException;
import com.klinikku.backend.user.UserRole;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    public PatientService(PatientRepository patientRepository, PasswordEncoder passwordEncoder) {
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> findAll() {
        return patientRepository.findAll(Sort.by(Sort.Direction.ASC, "fullName")).stream()
                .map(PatientResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Patient findById(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", patientId));
    }

    @Transactional
    public PatientResponse create(PatientRequest request) {
        Patient patient = new Patient();
        patient.setRole(UserRole.PATIENT);
        patient.setFullName(request.fullName());
        patient.setEmail(request.email());
        patient.setPasswordHash(passwordEncoder.encode(request.password()));
        patient.setPhoneNumber(request.phoneNumber());
        patient.setDateOfBirth(request.dateOfBirth());

        return PatientResponse.from(patientRepository.save(patient));
    }
}
