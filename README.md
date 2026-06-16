# Klinikku

Panduan ini menjelaskan cara menjalankan codebase Klinikku di local. Project ini terdiri dari:

- `backend/`: Spring Boot + Maven + PostgreSQL
- `frontend/`: React/TanStack Start + Vite
- `compose.yaml`: PostgreSQL untuk development local

## Prasyarat

Pastikan sudah terinstall:

- Java JDK 21 atau lebih baru
- Node.js dan npm
- Docker

Versi yang sudah pernah dipakai di environment ini:

- Java 26
- Node.js 26
- npm 11
- Docker 29

## 1. Jalankan Database

Dari root project:

```bash
docker compose up -d postgres
```

Database akan berjalan di:

- Host: `localhost`
- Port: `5432`
- Database: `klinikku`
- Username: `postgres`
- Password: `postgres`

Untuk mengecek container:

```bash
docker compose ps
```

Untuk menghentikan database:

```bash
docker compose down
```

Jika ingin menghapus data database local juga:

```bash
docker compose down -v
```

## 2. Jalankan Backend

Masuk ke folder backend:

```bash
cd backend
```

Siapkan file environment:

```bash
cp .env.example .env
```

Export variable dari `.env`, lalu jalankan Spring Boot:

```bash
set -a
source .env
set +a
./mvnw spring-boot:run
```

Backend berjalan di:

```text
http://localhost:8080
```

Endpoint untuk mengecek backend:

```bash
curl http://localhost:8080/api/v1/health
```

Swagger UI tersedia di:

```text
http://localhost:8080/api/docs
```

Catatan: migration database dijalankan otomatis oleh Flyway saat backend start.

## 3. Jalankan Frontend

Buka terminal baru, lalu masuk ke folder frontend:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Frontend berjalan di:

```text
http://localhost:3000
```

Secara default frontend akan memanggil backend di:

```text
http://localhost:8080
```

Jika backend berjalan di URL lain, buat file `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Akun Login Awal

Migration backend membuat akun admin awal:

```text
Email: admin
Password: admin
```

Login melalui:

```text
http://localhost:3000/login
```

## Perintah Development

Backend:

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run test
npm run lint
npm run format
npm run check
```

## Troubleshooting

### Backend gagal connect ke database

Pastikan PostgreSQL sudah jalan:

```bash
docker compose ps
```

Pastikan env backend sudah diexport sebelum menjalankan Maven:

```bash
cd backend
set -a
source .env
set +a
./mvnw spring-boot:run
```

Jika env tidak diexport, backend akan memakai default dari `application.yml`, yaitu user `localadmin`, yang tidak sama dengan user PostgreSQL di `compose.yaml`.

### Port 5432 sudah dipakai

Matikan PostgreSQL local lain, atau ubah mapping port di `compose.yaml`.

### Port 8080 atau 3000 sudah dipakai

Backend bisa diganti port-nya dengan environment variable:

```bash
SERVER_PORT=8081 ./mvnw spring-boot:run
```

Frontend bisa dijalankan dengan port lain:

```bash
npm run dev -- --port 3001
```

Jika port backend berubah, update juga `VITE_API_BASE_URL` di frontend.
