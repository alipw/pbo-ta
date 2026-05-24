export type PaymentStatus = "BELUM_BAYAR" | "LUNAS" | "DIBATALKAN";

export type PaymentMethodType = "CASH" | "TRANSFER" | "EWALLET";

export type Payment = {
	id: number;
	appointmentId: number;
	appointmentDate: string | null;
	patientId: number;
	patientName: string;
	doctorId: number;
	doctorName: string;
	amount: number;
	status: PaymentStatus;
	methodType: PaymentMethodType;
	methodDisplayName: string;
	referenceNumber: string | null;
	paidAt: string | null;
	createdAt: string;
	updatedAt: string;
};

export type PaymentResponse = Payment;
