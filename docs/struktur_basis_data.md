# 3.2.2 Struktur Basis Data

Bagian ini menjelaskan rancangan tabel basis data yang digunakan pada sistem Klinikku. Struktur tabel berikut disusun berdasarkan skema database pada file `backend/src/main/resources/db/migration/V1__init_schema.sql`.

## 3.2.2.1 Tabel User

Tabel `app_users` dirancang sebagai berikut:

**Tabel 1 Tabel Entitas User**

| Field | Tipe | Key |
| --- | --- | --- |
| ID | BIGINT | Primary Key |
| ROLE | VARCHAR(32) | - |
| FULL_NAME | VARCHAR(120) | - |
| EMAIL | VARCHAR(160) | Unique Key |
| PASSWORD_HASH | VARCHAR(255) | - |
| CREATED_AT | TIMESTAMP WITH TIME ZONE | - |
| UPDATED_AT | TIMESTAMP WITH TIME ZONE | - |

## 3.2.2.2 Tabel Admin

Tabel `admins` dirancang sebagai berikut:

**Tabel 2 Tabel Entitas Admin**

| Field | Tipe | Key |
| --- | --- | --- |
| USER_ID | BIGINT | Primary Key, Foreign Key |

## 3.2.2.3 Tabel Doctor

Tabel `doctors` dirancang sebagai berikut:

**Tabel 3 Tabel Entitas Doctor**

| Field | Tipe | Key |
| --- | --- | --- |
| USER_ID | BIGINT | Primary Key, Foreign Key |
| SPECIALIZATION | VARCHAR(120) | - |
| LICENSE_NUMBER | VARCHAR(64) | Unique Key |

## 3.2.2.4 Tabel Patient

Tabel `patients` dirancang sebagai berikut:

**Tabel 4 Tabel Entitas Patient**

| Field | Tipe | Key |
| --- | --- | --- |
| USER_ID | BIGINT | Primary Key, Foreign Key |
| PHONE_NUMBER | VARCHAR(32) | - |
| DATE_OF_BIRTH | DATE | - |

## 3.2.2.5 Tabel Doctor Schedule

Tabel `doctor_schedules` dirancang sebagai berikut:

**Tabel 5 Tabel Entitas Doctor Schedule**

| Field | Tipe | Key |
| --- | --- | --- |
| ID | BIGINT | Primary Key |
| DOCTOR_ID | BIGINT | Foreign Key |
| STARTS_AT | TIMESTAMP WITH TIME ZONE | - |
| ENDS_AT | TIMESTAMP WITH TIME ZONE | - |
| ROOM | VARCHAR(40) | - |
| STATUS | VARCHAR(24) | - |
| NOTES | VARCHAR(255) | - |
| CREATED_AT | TIMESTAMP WITH TIME ZONE | - |
| UPDATED_AT | TIMESTAMP WITH TIME ZONE | - |

## 3.2.2.6 Tabel Appointment

Tabel `appointments` dirancang sebagai berikut:

**Tabel 6 Tabel Entitas Appointment**

| Field | Tipe | Key |
| --- | --- | --- |
| ID | BIGINT | Primary Key |
| PATIENT_ID | BIGINT | Foreign Key |
| DOCTOR_ID | BIGINT | Foreign Key |
| SCHEDULE_ID | BIGINT | Foreign Key, Unique Key |
| STATUS | VARCHAR(24) | - |
| BOOKED_AT | TIMESTAMP WITH TIME ZONE | - |
| COMPLAINT | TEXT | - |
| CANCELLED_REASON | VARCHAR(255) | - |
| CREATED_AT | TIMESTAMP WITH TIME ZONE | - |
| UPDATED_AT | TIMESTAMP WITH TIME ZONE | - |

## 3.2.2.7 Tabel Medical Record

Tabel `medical_records` dirancang sebagai berikut:

**Tabel 7 Tabel Entitas Medical Record**

| Field | Tipe | Key |
| --- | --- | --- |
| ID | BIGINT | Primary Key |
| APPOINTMENT_ID | BIGINT | Foreign Key, Unique Key |
| PATIENT_ID | BIGINT | Foreign Key |
| DOCTOR_ID | BIGINT | Foreign Key |
| SYMPTOMS | TEXT | - |
| DIAGNOSIS | TEXT | - |
| TREATMENT_NOTES | TEXT | - |
| CREATED_AT | TIMESTAMP WITH TIME ZONE | - |
| UPDATED_AT | TIMESTAMP WITH TIME ZONE | - |

## 3.2.2.8 Tabel Payment

Tabel `payments` dirancang sebagai berikut:

**Tabel 8 Tabel Entitas Payment**

| Field | Tipe | Key |
| --- | --- | --- |
| ID | BIGINT | Primary Key |
| APPOINTMENT_ID | BIGINT | Foreign Key, Unique Key |
| AMOUNT | NUMERIC(12, 2) | - |
| STATUS | VARCHAR(24) | - |
| METHOD_TYPE | VARCHAR(24) | - |
| REFERENCE_NUMBER | VARCHAR(100) | - |
| PAID_AT | TIMESTAMP WITH TIME ZONE | - |
| CREATED_AT | TIMESTAMP WITH TIME ZONE | - |
| UPDATED_AT | TIMESTAMP WITH TIME ZONE | - |
