# Daftar Halaman Frontend

Dokumen ini mencatat halaman UI aktual yang ada di frontend Klinikku berdasarkan route TanStack Router di `frontend/src/routes`. Kategorisasi dibuat berdasarkan halaman/route, bukan berdasarkan fitur terpisah. Aksi seperti tambah, edit, hapus, lihat detail, ubah status, dan logout dicatat sebagai bagian dari halaman tempat aksi tersebut muncul.

## Halaman Umum

### Halaman Login

- Route: `/login`
- File: `frontend/src/routes/login.tsx`
- Akses: publik untuk pengguna yang belum login.
- Pengguna: admin, dokter, pasien.
- Fungsi halaman:
  - Menampilkan form masuk menggunakan email/username dan password.
  - Memvalidasi field wajib email dan password.
  - Menampilkan pesan error ketika kredensial tidak valid.
  - Mengarahkan pengguna yang berhasil login ke dashboard sesuai role:
    - Admin ke `/admin`
    - Dokter ke `/doctor`
    - Pasien ke `/patient`
  - Jika pengguna sudah login, halaman ini langsung mengarahkan ke halaman utama role terkait.

### Redirect Halaman Utama

- Route: `/`
- File: `frontend/src/routes/index.tsx`
- Akses: bergantung status login.
- Pengguna: admin, dokter, pasien.
- Fungsi halaman:
  - Mengecek sesi pengguna saat membuka root aplikasi.
  - Mengarahkan pengguna yang belum login ke `/login`.
  - Mengarahkan pengguna yang sudah login ke dashboard sesuai role.

### Layout Aplikasi Terautentikasi

- Route group: `/_authenticated`
- File: `frontend/src/routes/_authenticated.tsx`
- Komponen utama: `frontend/src/components/app-sidebar.tsx`
- Akses: hanya pengguna yang sudah login.
- Pengguna: admin, dokter, pasien.
- Fungsi halaman/shell:
  - Menyediakan layout utama aplikasi setelah login.
  - Menampilkan sidebar sesuai role pengguna.
  - Menampilkan identitas pengguna, yaitu email dan role.
  - Menyediakan tombol `Keluar` untuk logout.
  - Setelah logout, pengguna diarahkan kembali ke `/login`.

## Halaman Admin

### Dashboard Admin

- Route: `/admin`
- File: `frontend/src/routes/_authenticated/admin/index.tsx`
- Akses: admin.
- Fungsi halaman:
  - Menampilkan ringkasan modul operasional klinik untuk admin.
  - Menampilkan kartu modul Dokter, Pasien, Appointment, Jadwal, dan Pembayaran.
  - Menjadi halaman awal setelah admin login.
  - Logout tersedia melalui sidebar pada layout aplikasi.

### Halaman Daftar Dokter

- Route: `/admin/doctors`
- File: `frontend/src/routes/_authenticated/admin/doctors.tsx`
- Akses: admin.
- Fungsi halaman:
  - Menampilkan tabel daftar dokter.
  - Menampilkan data nama, email, spesialisasi, nomor lisensi, dan tanggal dibuat.
  - Menambahkan data dokter dan akun masuk dokter.
  - Mengedit data dokter.
  - Menghapus data dokter dengan dialog konfirmasi.
  - Menampilkan status loading dan pesan error ketika data gagal dimuat atau aksi gagal.

### Halaman Daftar Pasien

- Route: `/admin/patients`
- File: `frontend/src/routes/_authenticated/admin/patients.tsx`
- Akses: admin.
- Fungsi halaman:
  - Menampilkan tabel daftar pasien.
  - Menampilkan data nama, email, nomor telepon, tanggal lahir, dan tanggal dibuat.
  - Menambahkan data pasien dan akun masuk pasien.
  - Mengedit data pasien.
  - Menghapus data pasien dengan dialog konfirmasi.
  - Menampilkan status loading dan pesan error ketika data gagal dimuat atau aksi gagal.

### Halaman Appointment Admin

- Route: `/admin/appointments`
- File: `frontend/src/routes/_authenticated/admin/appointments.tsx`
- Akses: admin.
- Fungsi halaman:
  - Menampilkan kalender appointment klinik.
  - Membuat appointment untuk pasien dan dokter.
  - Mengedit appointment yang sudah ada.
  - Menghapus appointment beserta jadwal dokter terkait.
  - Mengubah status appointment, seperti Menunggu, Disetujui, Selesai, dan Dibatalkan.
  - Membatalkan appointment melalui menu konteks kalender.
  - Menampilkan error ketika data appointment gagal dimuat atau jadwal bertabrakan.

### Halaman Jadwal Admin

- Route: `/admin/schedules`
- File: `frontend/src/routes/_authenticated/admin/schedules.tsx`
- Akses: admin.
- Fungsi halaman:
  - Menampilkan kalender jadwal praktik dokter.
  - Membuat jadwal praktik dokter tanpa appointment pasien.
  - Mengedit jadwal praktik yang belum berstatus booked.
  - Menghapus jadwal praktik dengan dialog konfirmasi.
  - Menampilkan status jadwal, seperti Tersedia, Booked, dan Dibatalkan.
  - Mencegah pengelolaan jadwal booked dari halaman jadwal karena jadwal tersebut dikelola melalui appointment terkait.

### Halaman Rekam Medis Admin

- Route: `/admin/records`
- File: `frontend/src/routes/_authenticated/admin/records.tsx`
- Akses: admin.
- Fungsi halaman:
  - Menampilkan seluruh rekam medis pasien yang sudah dicatat dokter.
  - Menampilkan tabel rekam medis berisi pasien, dokter, appointment, diagnosis, dan tanggal dibuat.
  - Membuka dialog detail rekam medis.
  - Menampilkan isi detail pemeriksaan dari appointment yang sudah selesai.
  - Menampilkan empty state ketika belum ada rekam medis.

### Halaman Pembayaran Admin

- Route: `/admin/payments`
- File: `frontend/src/routes/_authenticated/admin/payments.tsx`
- Akses: admin.
- Fungsi halaman:
  - Menampilkan daftar pembayaran/tagihan konsultasi.
  - Menampilkan ringkasan status pembayaran.
  - Membuat tagihan pembayaran untuk appointment yang dapat ditagihkan.
  - Melihat detail pembayaran.
  - Mengubah status pembayaran, metode pembayaran, nomor referensi, dan waktu pembayaran.
  - Mengelola status Belum Bayar, Lunas, dan Dibatalkan.
  - Menampilkan status loading, empty state, dan pesan error ketika data atau aksi pembayaran gagal.

## Halaman Dokter

### Dashboard Dokter

- Route: `/doctor`
- File: `frontend/src/routes/_authenticated/doctor/index.tsx`
- Akses: dokter.
- Fungsi halaman:
  - Menampilkan area utama dokter setelah login.
  - Menampilkan kartu ringkasan Jadwal Saya, Appointment, dan Rekam Medis.
  - Menjadi halaman awal setelah dokter login.
  - Logout tersedia melalui sidebar pada layout aplikasi.

### Halaman Appointment Dokter

- Route: `/doctor/appointments`
- File: `frontend/src/routes/_authenticated/doctor/appointments.tsx`
- Akses: dokter.
- Fungsi halaman:
  - Menampilkan kalender appointment milik dokter yang sedang login.
  - Membuat appointment baru untuk pasien pada jadwal dokter tersebut.
  - Mengedit appointment.
  - Menghapus appointment beserta jadwal dokter terkait.
  - Mengubah status appointment, seperti Menunggu, Disetujui, Selesai, dan Dibatalkan.
  - Membatalkan appointment melalui menu konteks kalender.
  - Menampilkan pesan error ketika daftar appointment gagal dimuat atau aksi gagal.

### Halaman Rekam Medis Dokter

- Route: `/doctor/records`
- File: `frontend/src/routes/_authenticated/doctor/records.tsx`
- Akses: dokter.
- Fungsi halaman:
  - Menampilkan daftar rekam medis pasien yang berkaitan dengan dokter.
  - Membuat rekam medis dari appointment yang sudah selesai dan belum memiliki rekam medis.
  - Mengisi gejala, diagnosis, dan catatan tindakan/perawatan.
  - Melihat detail rekam medis.
  - Menampilkan empty state ketika belum ada rekam medis.
  - Menampilkan error khusus ketika rekam medis dibuat dari appointment yang belum selesai atau appointment yang sudah memiliki rekam medis.

## Halaman Pasien

### Halaman Janji Temu Pasien

- Route: `/patient`
- File: `frontend/src/routes/_authenticated/patient/index.tsx`
- Akses: pasien.
- Fungsi halaman:
  - Menampilkan kalender jadwal praktik dokter yang tersedia.
  - Memilih jadwal tersedia untuk mengajukan janji temu.
  - Mengisi keluhan singkat saat mengajukan janji temu.
  - Menampilkan daftar ringkas pengajuan janji temu terbaru milik pasien.
  - Menampilkan status pengajuan, seperti Menunggu, Disetujui, Selesai, dan Dibatalkan.
  - Menampilkan pesan sukses atau error setelah pengajuan janji temu.
  - Menjadi halaman awal setelah pasien login.
  - Logout tersedia melalui sidebar pada layout aplikasi.

### Halaman Rekam Medis Pasien

- Route: `/patient/records`
- File: `frontend/src/routes/_authenticated/patient/records.tsx`
- Akses: pasien.
- Fungsi halaman:
  - Menampilkan riwayat rekam medis milik pasien.
  - Menampilkan tabel berisi dokter, appointment, diagnosis, dan tanggal dibuat.
  - Membuka dialog detail rekam medis.
  - Menampilkan isi hasil konsultasi yang sudah dicatat dokter.
  - Menampilkan empty state ketika pasien belum memiliki rekam medis.

### Halaman Pembayaran Pasien

- Route: `/patient/payments`
- File: `frontend/src/routes/_authenticated/patient/payments.tsx`
- Akses: pasien.
- Fungsi halaman:
  - Menampilkan tagihan dan riwayat pembayaran milik pasien.
  - Menampilkan ringkasan jumlah tagihan Belum Bayar, Lunas, dan Dibatalkan.
  - Menampilkan tabel pembayaran berisi dokter, appointment, nominal, metode, status, dan tanggal.
  - Membuka dialog detail pembayaran.
  - Melihat status tagihan konsultasi dan riwayat pembayaran appointment.
  - Menampilkan empty state ketika pasien belum memiliki pembayaran.

## Catatan Route dan Akses

- Route admin dilindungi agar hanya role `ADMIN` yang dapat mengaksesnya.
- Route dokter dilindungi agar hanya role `DOCTOR` yang dapat mengaksesnya.
- Route pasien dilindungi agar hanya role `PATIENT` yang dapat mengaksesnya.
- Jika pengguna membuka halaman milik role lain, aplikasi mengarahkan pengguna ke halaman utama role miliknya.
- Logout bukan halaman terpisah. Logout adalah aksi pada sidebar layout terautentikasi dan berlaku untuk admin, dokter, serta pasien.
