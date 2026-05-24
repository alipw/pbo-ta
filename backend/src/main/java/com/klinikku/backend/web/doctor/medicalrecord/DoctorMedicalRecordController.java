package com.klinikku.backend.web.doctor.medicalrecord;

import com.klinikku.backend.auth.AuthenticatedUser;
import com.klinikku.backend.medicalrecord.MedicalRecordRequest;
import com.klinikku.backend.medicalrecord.MedicalRecordResponse;
import com.klinikku.backend.medicalrecord.MedicalRecordService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/doctor/records")
public class DoctorMedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public DoctorMedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @GetMapping
    public List<MedicalRecordResponse> listRecords(@AuthenticationPrincipal AuthenticatedUser user) {
        return medicalRecordService.findAllForDoctor(user.id());
    }

    @GetMapping("/{recordId}")
    public MedicalRecordResponse getRecord(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long recordId) {
        return medicalRecordService.findResponseByIdForDoctor(recordId, user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalRecordResponse createRecord(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody MedicalRecordRequest request) {
        return medicalRecordService.createForDoctor(user.id(), request);
    }
}
