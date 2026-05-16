package com.klinikku.backend.doctor;

import com.klinikku.backend.common.ResourceNotFoundException;
import com.klinikku.backend.user.UserRole;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
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
        doctor.setFullName(request.fullName());
        doctor.setEmail(request.email());
        doctor.setPasswordHash(request.passwordHash());
        doctor.setSpecialization(request.specialization());
        doctor.setLicenseNumber(request.licenseNumber());

        return DoctorResponse.from(doctorRepository.save(doctor));
    }
}
