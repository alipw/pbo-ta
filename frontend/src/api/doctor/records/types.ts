export type MedicalRecord = {
	id: number;
	appointmentId: number;
	patientId: number;
	patientName: string;
	doctorId: number;
	doctorName: string;
	symptoms: string | null;
	diagnosis: string;
	treatmentNotes: string | null;
	createdAt: string;
	updatedAt: string;
};

export type MedicalRecordRequest = {
	appointmentId: number;
	diagnosis: string;
	symptoms?: string;
	treatmentNotes?: string;
};

export type MedicalRecordResponse = MedicalRecord;
