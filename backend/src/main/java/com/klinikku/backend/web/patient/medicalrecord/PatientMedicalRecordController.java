package com.klinikku.backend.web.patient.medicalrecord;

import com.klinikku.backend.auth.AuthenticatedUser;
import com.klinikku.backend.medicalrecord.MedicalRecordResponse;
import com.klinikku.backend.medicalrecord.MedicalRecordService;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patient/records")
public class PatientMedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public PatientMedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @GetMapping
    public List<MedicalRecordResponse> listRecords(@AuthenticationPrincipal AuthenticatedUser user) {
        return medicalRecordService.findAllForPatient(user.id());
    }

    @GetMapping("/{recordId}")
    public MedicalRecordResponse getRecord(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long recordId) {
        return medicalRecordService.findResponseByIdForPatient(recordId, user.id());
    }
}
