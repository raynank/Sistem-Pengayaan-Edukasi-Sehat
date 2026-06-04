# Sistem Pengayaan Edukasi Internet Sehat

## Deskripsi Singkat

**Internet Sehat** adalah aplikasi web dan ekstensi peramban (Chrome Extension) yang dirancang untuk membantu pengguna mengontrol kebiasaan berselancar di internet. Sistem ini secara otomatis **memblokir akses ke situs-situs konten negatif** (seperti judi online, pornografi, dan situs terlarang lainnya) serta memotivasi pengguna melalui sistem **pelacakan pencapaian beruntun (*streak tracking*)** agar terbiasa berselancar secara sehat dan positif.

### Fitur Utama
- **Pemblokiran Otomatis** — Ekstensi Chrome memantau dan memblokir URL yang termasuk dalam daftar domain terlarang (*blacklist*) secara real-time.
- **Dasbor Pencapaian** — Halaman web interaktif untuk memantau streak harian dan statistik penggunaan internet.
- **Autentikasi Pengguna** — Sistem registrasi dan login berbasis JWT.
- **Sinkronisasi Blacklist** — Daftar domain terlarang dapat diperbarui secara berkala dari sumber terpercaya (*Trust Positif*).

---

## Arsitektur Sistem — 3 Virtual Machine

Sistem dijalankan secara terisolasi menggunakan **tiga Virtual Machine (VM)** Ubuntu Server yang dikelola secara otomatis oleh **Vagrant** dan dikonfigurasi dengan **Ansible**. Setiap VM memiliki tanggung jawab yang terpisah dan terhubung melalui jaringan privat internal.

```
[Browser Pengguna]
      │
      ├─── Ekstensi Chrome (background.js)
      │         │  Cek blacklist & catat streak
      │         ▼
      │   ┌─────────────────────────────────────┐
      │   │  VM Backend (cc-be) — 192.168.56.11 │
      │   │  Flask + Gunicorn + Nginx + Docker  │
      │   └──────────────┬──────────────────────┘
      │                  │ PostgreSQL connection
      │                  ▼
      │   ┌─────────────────────────────────────┐
      │   │  VM Database (cc-db) — 192.168.56.10│
      │   │  PostgreSQL 16 via Docker           │
      │   └─────────────────────────────────────┘
      │
      └─── Akses Dasbor Web
                │
                ▼
      ┌──────────────────────────────────────────┐
      │  VM Frontend (cc-fe) — 192.168.56.12     │
      │  Next.js 14 + Tailwind CSS via Docker   │
      └──────────────────────────────────────────┘
```

### Tabel Spesifikasi VM

| VM | Hostname | IP Address | RAM | Service Utama | Port Publik |
|---|---|---|---|---|---|
| Database | `cc-db` | `192.168.56.10` | 2 GB | PostgreSQL 16 via Docker | `5432` |
| Backend | `cc-be` | `192.168.56.11` | 2 GB | Flask + Gunicorn + Nginx via Docker Compose | `80` |
| Frontend | `cc-fe` | `192.168.56.12` | 2 GB | Next.js 14 via Docker | `80` |

---

## Pembagian Fungsi Setiap VM

### VM Database (`cc-db` — 192.168.56.10)
Bertanggung jawab sebagai **pusat penyimpanan data** seluruh sistem.
- Menjalankan **PostgreSQL 16** di dalam kontainer Docker.
- Menyimpan seluruh tabel yang dibutuhkan aplikasi:
  - `users` — Data akun pengguna (hashed password, streak, dll).
  - `blacklist_domains` — Daftar domain yang diblokir.
  - `access_logs` — Riwayat akses dan pemblokiran.
- Hanya dapat diakses oleh VM Backend (port `5432` tidak diekpos ke host).
- Konfigurasi kredensial dikelola melalui file `.env`.

### VM Backend (`cc-be` — 192.168.56.11)
Bertanggung jawab sebagai **otak/logika aplikasi** dan jembatan antara database dan klien (frontend + ekstensi).
- Menjalankan **Flask** (Python) sebagai API server dengan **Gunicorn** sebagai WSGI.
- **Nginx** bertindak sebagai *reverse proxy* yang meneruskan request HTTP port `80` ke Gunicorn.
- Menyediakan REST API endpoint yang digunakan oleh frontend dan ekstensi Chrome:
  - `GET  /health` — Health check status server.
  - `POST /api/auth/register` — Registrasi pengguna baru.
  - `POST /api/auth/login` — Login dan mendapatkan token JWT.
  - `GET  /api/blacklist/` — Mengambil daftar domain terlarang (digunakan ekstensi).
  - `POST /api/tracker/log` — Mencatat percobaan akses situs terlarang.
- Menghubungkan diri ke VM Database melalui `DATABASE_URL` di file `.env`.

### VM Frontend (`cc-fe` — 192.168.56.12)
Bertanggung jawab sebagai **antarmuka visual** yang diakses pengguna melalui browser.
- Menjalankan aplikasi **Next.js 14** yang dikompilasi menjadi bundle produksi.
- Menampilkan halaman-halaman utama:
  - `/` — Dasbor utama dengan info streak dan status pemblokiran.
  - `/login` & `/register` — Halaman autentikasi pengguna.
  - `/hold-on` — Halaman pengalihan saat ekstensi memblokir situs.
- Berkomunikasi dengan VM Backend melalui `NEXT_PUBLIC_API_URL` (`http://192.168.56.11/api`).

---

## Tools & Teknologi yang Digunakan

### Infrastruktur & Orkestrasi
| Teknologi | Versi | Peran |
|---|---|---|
| **Vagrant** | latest | Membuat dan mengelola lifecycle VM secara deklaratif |
| **Ansible** | latest | Mengotomasi instalasi software dan konfigurasi di dalam VM |
| **VirtualBox** | latest | Hypervisor untuk menjalankan VM secara lokal |
| **Docker** | 29.x | Kontainerisasi semua layanan agar terisolasi dan portabel |
| **Docker Compose** | v2 | Mendefinisikan dan menjalankan multi-kontainer dalam satu VM |

### VM Database
| Teknologi | Peran |
|---|---|
| **PostgreSQL 16** (Alpine) | Sistem manajemen database relasional |

### VM Backend
| Teknologi | Peran |
|---|---|
| **Python 3.11** | Bahasa pemrograman utama |
| **Flask 3.0.3** | Framework web untuk REST API |
| **Gunicorn 22.0** | WSGI server produksi untuk menjalankan Flask |
| **Nginx** (Alpine) | Reverse proxy untuk meneruskan request ke Gunicorn |
| **Flask-SQLAlchemy** | ORM untuk berinteraksi dengan database PostgreSQL |
| **Flask-Bcrypt** | Hashing password pengguna |
| **PyJWT** | Pembuatan dan validasi JSON Web Token (JWT) |
| **psycopg2** | Driver koneksi Python ke PostgreSQL |
| **python-dotenv** | Membaca konfigurasi dari file `.env` |

### VM Frontend
| Teknologi | Peran |
|---|---|
| **Next.js 14** | Framework React dengan SSG dan routing terintegrasi |
| **React 18** | Library UI deklaratif |
| **TypeScript 5** | Superset JavaScript dengan tipe statis |
| **Tailwind CSS 3** | Utility-first CSS framework |
| **Axios** | HTTP client untuk komunikasi ke Backend API |
| **Lucide React** | Library ikon SVG |

### Chrome Extension
| Teknologi | Peran |
|---|---|
| **Manifest V3** | Standar ekstensi Chrome terbaru |
| **declarativeNetRequest** | API Chrome untuk pemblokiran URL secara deklaratif |
| **Service Worker** | Background script yang aktif tanpa halaman UI |

---

## Cara Instalasi & Menjalankan Aplikasi

### Prasyarat

Pastikan software berikut sudah terinstal di komputer host (Windows/macOS/Linux):

1. **Oracle VirtualBox** — [virtualbox.org/wiki/Downloads](https://www.virtualbox.org/wiki/Downloads)
2. **Vagrant** — [vagrantup.com/downloads](https://www.vagrantup.com/downloads)

Verifikasi instalasi dengan menjalankan perintah berikut di terminal:
```powershell
vagrant --version
# Contoh output: Vagrant 2.4.x
```

---

### Langkah 1: Klon Repository
```bash
git clone <url-repository>
cd tubes2
```

---

### Langkah 2: Konfigurasi File Environment (`.env`)

File `.env` berisi kredensial sensitif dan **tidak boleh di-commit ke git**. Buat file `.env` dari template contoh yang tersedia:

**Database:**
```bash
# Linux/macOS
cp database/.env_example database/.env

# Windows (PowerShell)
Copy-Item database/.env_example database/.env
```

**Backend:**
```bash
# Linux/macOS
cp backend/.env_example backend/.env

# Windows (PowerShell)
Copy-Item backend/.env_example backend/.env
```

> **Penting:** Pastikan nilai `POSTGRES_PASSWORD` di `database/.env` dan bagian password di `DATABASE_URL` dalam `backend/.env` **sama persis**.

Isi default file `.env`:

| File | Variabel | Nilai Default |
|---|---|---|
| `database/.env` | `POSTGRES_USER` | `internetsehat_user` |
| `database/.env` | `POSTGRES_PASSWORD` | `internetsehat_dev_password_2026` |
| `database/.env` | `POSTGRES_DB` | `internetsehat_db` |
| `backend/.env` | `DATABASE_URL` | `postgresql://internetsehat_user:internetsehat_dev_password_2026@192.168.56.10:5432/internetsehat_db` |
| `backend/.env` | `SECRET_KEY` | *(generate secara acak atau isi sendiri)* |

---

### Langkah 3: Jalankan Semua VM

Buka terminal di folder root project (`tubes2`), lalu jalankan:
```powershell
vagrant up
```

Perintah ini akan secara **otomatis** melakukan:
1. Mengunduh base image Ubuntu 22.04 (hanya sekali pada penggunaan pertama).
2. Membuat 3 VM di VirtualBox dan mengonfigurasi jaringan privat internal.
3. Menjalankan Ansible *playbook* di setiap VM untuk:
   - Menginstal Docker dan Docker Compose.
   - **VM Database:** Menjalankan kontainer PostgreSQL, membaca konfigurasi dari `database/.env`.
   - **VM Backend:** Build image Docker Flask, menjalankan Gunicorn & Nginx, menginisialisasi tabel database (`init_db.py`).
   - **VM Frontend:** Build image Docker Next.js, menjalankan server produksi.

> **Catatan:** Proses `vagrant up` pertama kali membutuhkan waktu beberapa menit karena harus mengunduh *base image* dan membangun *Docker image*.

---

### Langkah 4: Verifikasi Sistem Berjalan

Setelah `vagrant up` selesai, akses tautan berikut melalui browser:

| Komponen | URL | Respons yang Diharapkan |
|---|---|---|
| Frontend (Dasbor) | `http://192.168.56.12` | Halaman utama Internet Sehat |
| Backend Health Check | `http://192.168.56.11/health` | `{"status": "ok"}` |
| Backend Blacklist API | `http://192.168.56.11/api/blacklist/` | JSON berisi daftar domain terblokir |

---

### Langkah 5: Pasang Chrome Extension

1. Buka Chrome dan akses `chrome://extensions`.
2. Aktifkan **Developer mode** (pojok kanan atas).
3. Klik **Load unpacked**.
4. Pilih folder `extension/` yang ada di dalam repository ini.
5. Ekstensi akan langsung aktif dan mulai memantau URL yang diakses.

> **Catatan:** Karena masih dalam mode pengembangan (*Developer Mode*), mekanisme pemblokiran mungkin tidak 100% konsisten di semua kondisi akibat restriksi keamanan Chrome terhadap ekstensi yang belum dipublikasikan.

---

## Perintah Vagrant yang Sering Digunakan

| Perintah | Fungsi |
|---|---|
| `vagrant up` | Buat dan jalankan semua VM |
| `vagrant up db` | Jalankan hanya VM Database |
| `vagrant up backend` | Jalankan hanya VM Backend |
| `vagrant up frontend` | Jalankan hanya VM Frontend |
| `vagrant halt` | Matikan (shutdown) semua VM |
| `vagrant destroy -f` | Hapus semua VM beserta datanya |
| `vagrant status` | Cek status nyala/mati setiap VM |
| `vagrant provision` | Jalankan ulang Ansible provisioner |
| `vagrant ssh db` | Masuk ke terminal VM Database |
| `vagrant ssh backend` | Masuk ke terminal VM Backend |
| `vagrant ssh frontend` | Masuk ke terminal VM Frontend |

---

## Troubleshooting

### Melihat Log Aplikasi di Dalam VM

```bash
# Cek log Flask/Gunicorn
vagrant ssh backend
docker logs internetsehat_flask

# Cek log Nginx
docker logs internetsehat_nginx

# Cek log PostgreSQL
vagrant ssh db
docker logs internetsehat_db

# Cek log Frontend Next.js
vagrant ssh frontend
docker logs internetsehat_frontend
```

### Menginisialisasi Database Secara Manual

Jika database belum terinisialisasi (tabel belum terbuat):
```bash
vagrant ssh backend -c "docker exec internetsehat_flask python init_db.py"
```

### Sinkronisasi Daftar Blacklist (*Trust Positif*)

Secara default, database hanya berisi beberapa domain contoh. Untuk memuat daftar lengkap dari sumber *Trust Positif*:
```powershell
vagrant ssh backend -c "docker exec internetsehat_flask python sync_blacklist.py"
```

### Reset Database (Hapus Semua Data)

Jika ingin menghapus volume database dan memulai dari awal:
```bash
vagrant ssh db -c "cd /home/vagrant/app/database && docker compose down -v && docker compose up -d"
# Kemudian inisialisasi ulang tabel dari VM Backend
vagrant ssh backend -c "docker exec internetsehat_flask python init_db.py"
```
