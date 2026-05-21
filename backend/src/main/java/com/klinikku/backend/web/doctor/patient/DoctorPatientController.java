package com.klinikku.backend.web.doctor.patient;

import com.klinikku.backend.patient.PatientResponse;
import com.klinikku.backend.patient.PatientService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/doctor/patients")
public class DoctorPatientController {

    private final PatientService patientService;

    public DoctorPatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public List<PatientResponse> listPatients() {
        return patientService.findAll();
    }
}
