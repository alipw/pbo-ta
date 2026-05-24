package com.klinikku.backend.web.admin.medicalrecord;

import com.klinikku.backend.medicalrecord.MedicalRecordResponse;
import com.klinikku.backend.medicalrecord.MedicalRecordService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/records")
public class AdminMedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public AdminMedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @GetMapping
    public List<MedicalRecordResponse> listRecords() {
        return medicalRecordService.findAll();
    }

    @GetMapping("/{recordId}")
    public MedicalRecordResponse getRecord(@PathVariable Long recordId) {
        return medicalRecordService.findResponseById(recordId);
    }
}
