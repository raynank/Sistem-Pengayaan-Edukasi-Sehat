# PRD — Migrasi NoPMO Tracker ke 3-VM Architecture dengan Docker

**Versi:** 2.0 (Final)
**Tanggal:** 24 Mei 2026
**Status:** Diimplementasikan

---

## 1. Latar Belakang

Project NoPMO Tracker awalnya berjalan secara monolitik di local development:
- Database: SQLite (file lokal)
- Backend: Flask development server (`python run.py`)
- Frontend: Next.js development server (`npm run dev`)

Tujuan migrasi ini adalah memisahkan tiga layer aplikasi ke tiga VM terpisah menggunakan Docker, dengan Nginx sebagai reverse proxy berkeamanan tinggi di VM backend.

---

## 2. Tujuan

1. **Isolasi concerns** — database, backend, dan frontend berjalan di VM yang terpisah
2. **Production-ready** — menggunakan Gunicorn (bukan Flask dev server) dan Nginx
3. **HTTPS** — semua traffic dienkripsi menggunakan Let's Encrypt (TLS 1.2/1.3)
4. **Keamanan** — port database tidak diexpose ke publik, CORS dibatasi ke domain frontend, rate limiting pada endpoint auth
5. **Portabilitas** — seluruh komponen terkontainerisasi sehingga mudah dipindahkan atau di-scale

---

## 3. Arsitektur Target

```
[ Internet / Browser Extension ]
          │
          ▼
[ vm-frontend ]  ──── HTTPS ────▶  [ vm-backend ]  ──── TCP:5432 ────▶  [ vm-database ]
  Sumopod (Public IP)               192.168.1.11                          192.168.1.10
  Next.js : port 3000               Nginx : port 80/443                   PostgreSQL : 5432
  Domain dikonfigurasi user         └── Flask+Gunicorn : port 5000        (bind lokal, tidak publik)
                                        (internal Docker network)
```

### IP dan Port Mapping

| VM | IP | Port Publik | Port Internal | Komponen |
|---|---|---|---|---|
| `vm-database` | `192.168.1.10` | — | `5432` (lokal) | PostgreSQL 16 |
| `vm-backend` | `192.168.1.11` | `80`, `443` | `5000` (internal) | Nginx + Flask/Gunicorn |
| `vm-frontend` | Sumopod Public IP | `3000` | — | Next.js |

---

## 4. Spesifikasi Per VM

### 4.1 `vm-database`

**Komponen:** PostgreSQL 16 Alpine

**File:**
- `database/docker-compose.yml` — container PostgreSQL dengan named volume untuk persistensi data
- `database/.env.example` — template kredensial (disalin ke `.env` saat deploy)

**Keputusan desain:**
- Port `5432` di-bind ke `192.168.1.10:5432` saja (bukan `0.0.0.0:5432`) sehingga tidak accessible dari internet
- Named volume `pgdata` memastikan data tidak hilang saat container restart atau di-recreate
- Health check `pg_isready` memastikan PostgreSQL benar-benar siap sebelum backend mencoba konek

**Schema Database setelah `init_db.py`:**

Tabel `users`:
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto increment |
| `email` | VARCHAR(120) UNIQUE | Email pengguna |
| `password_hash` | VARCHAR(128) | Bcrypt hash — tidak pernah plaintext |
| `start_date` | DATETIME | Tanggal mulai streak saat ini |
| `longest_streak` | INTEGER | Rekor streak terpanjang (hari) |

Tabel `relapse_logs`:
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto increment |
| `user_id` | INTEGER FK | Referensi ke `users.id` |
| `relapse_date` | DATETIME | Waktu relapse |
| `streak_days` | INTEGER | Panjang streak yang gagal |

Tabel `blacklist_domains` (terseed otomatis):
| `id` | `domain_name` |
|---|---|
| 1 | `pornhub.com` |
| 2 | `nhentai.net` |
| 3 | `xvideos.com` |

> Catatan: Tidak ada data yang perlu dimitrasi dari SQLite karena database lokal belum pernah dibuat (`backend/instance/` tidak ada di repository).

---

### 4.2 `vm-backend`

**Komponen:** Flask + Gunicorn (Docker) + Nginx (Docker)

**File:**
- `backend/Dockerfile` — build image Python 3.11-slim + Gunicorn
- `backend/docker-compose.yml` — orkestrasi service `flask` dan `nginx`
- `backend/nginx/default.conf` — konfigurasi reverse proxy + HTTPS
- `backend/.env.example` — template `SECRET_KEY` dan `DATABASE_URL`
- `backend/app/__init__.py` — diubah: CORS dikunci ke domain frontend

**Keputusan desain:**

**Gunicorn:**
- 4 worker process (`-w 4`) untuk menangani concurrent requests
- Bind ke `0.0.0.0:5000` di dalam Docker network (tidak ke host)
- Timeout 120 detik

**Nginx:**
- Menjalankan dua server block: HTTP (redirect ke HTTPS) dan HTTPS
- SSL certificates dari Let's Encrypt (Certbot di host, di-mount read-only ke container)
- TLS 1.2 dan 1.3 saja — TLS 1.0 dan 1.1 dinonaktifkan
- Header keamanan: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`
- Rate limiting 10 request/menit pada `/api/auth/` untuk mitigasi brute force login
- Endpoint selain `/api/` mengembalikan 404 (backend tidak melayani static files)

**CORS:**
- Sebelumnya: `CORS(app)` — allow all origins
- Sesudah: dibatasi ke `https://yourdomain.com` dan `https://www.yourdomain.com`

**Docker networking:**
- Service `flask` dan `nginx` berada di network `backend_net` (bridge)
- `flask` hanya di-`expose` (tidak di-`ports`) sehingga port 5000 tidak accessible dari host
- `nginx` yang memegang port 80 dan 443 ke host

---

### 4.3 `vm-frontend`

**Komponen:** Next.js 14 (Docker, standalone output)

**File:**
- `frontend/Dockerfile` — multi-stage build (builder + runner)
- `frontend/docker-compose.yml` — container Next.js dengan `NEXT_PUBLIC_API_URL`
- `frontend/next.config.js` — tambah `output: 'standalone'`
- `frontend/.env.example` — template URL API

**Keputusan desain:**

**Multi-stage Dockerfile:**
- Stage `builder`: install semua deps termasuk devDependencies, jalankan `npm run build`
- Stage `runner`: hanya salin `.next/standalone` + `.next/static` + `public/` — image akhir jauh lebih kecil karena tidak membawa `node_modules` penuh

**`output: 'standalone'`:**
- Next.js menghasilkan `server.js` mandiri yang tidak membutuhkan `node_modules` di production
- Cocok untuk container Docker yang ringan

**`NEXT_PUBLIC_API_URL`:**
- Variable ini di-embed ke dalam client-side JavaScript bundle saat `npm run build`
- Oleh karena itu harus diset sebagai Docker build argument (`ARG`), bukan hanya environment variable runtime
- Sudah terkonfigurasi di `docker-compose.yml` sebagai `build.args`

---

### 4.4 Extension

**File yang diubah:** `extension/background.js`

| Variabel | Sebelum | Sesudah |
|---|---|---|
| `API_URL` | `http://localhost:5000/api/blacklist/` | `https://api.yourdomain.com/api/blacklist/` |
| `REDIRECT_URL` | `http://localhost:3000/hold-on` | `https://yourdomain.com/hold-on` |

> Setelah domain aktual diketahui, ganti `yourdomain.com` di kedua file ini dan reload extension.

---

## 5. Alur Deployment

```
Langkah 1: vm-database
├── cp database/.env.example database/.env
├── Isi POSTGRES_PASSWORD
└── docker compose up -d

Langkah 2: vm-backend
├── Install Certbot di host VM
├── certbot certonly --standalone -d api.yourdomain.com
├── Ganti 'yourdomain.com' di nginx/default.conf
├── cp backend/.env.example backend/.env
├── Isi SECRET_KEY dan DATABASE_URL
├── docker compose up -d
└── docker exec nopmo_flask python init_db.py

Langkah 3: vm-frontend (Sumopod)
├── Ganti 'yourdomain.com' di frontend/docker-compose.yml
├── docker compose up -d
└── Konfigurasi domain di Sumopod dashboard

Langkah 4: Extension
├── Ganti yourdomain.com di extension/background.js
└── Reload extension di browser
```

---

## 6. Ringkasan Perubahan File

| File | Aksi | Keterangan |
|---|---|---|
| `database/docker-compose.yml` | Dibuat | Container PostgreSQL |
| `database/.env.example` | Dibuat | Template kredensial DB |
| `backend/Dockerfile` | Dibuat | Build image Flask+Gunicorn |
| `backend/docker-compose.yml` | Dibuat | Orkestrasi Flask + Nginx |
| `backend/nginx/default.conf` | Dibuat | Reverse proxy + HTTPS |
| `backend/.env.example` | Dibuat | Template env backend |
| `backend/app/__init__.py` | Diedit | Restrict CORS ke domain FE |
| `frontend/Dockerfile` | Dibuat | Multi-stage build Next.js |
| `frontend/docker-compose.yml` | Dibuat | Container Next.js |
| `frontend/next.config.js` | Dibuat | Output standalone |
| `frontend/.env.example` | Dibuat | Template env frontend |
| `extension/background.js` | Diedit | URL hardcode → domain production |
| `README.md` | Diedit | Dokumentasi deployment baru |
| `PRD.md` | Dibuat | Dokumen ini |

---

## 7. Catatan Keamanan

| Aspek | Implementasi |
|---|---|
| Password database | Bcrypt hash (`$2b$12$...`) — tidak pernah disimpan plaintext |
| JWT Secret | `SECRET_KEY` dari env var, tidak di-hardcode |
| Database port | Bind ke IP lokal saja, tidak ke `0.0.0.0` |
| Flask port | Tidak diexpose ke host, hanya via Nginx |
| HTTPS | TLS 1.2/1.3 + Let's Encrypt |
| CORS | Dibatasi ke domain frontend saja |
| Rate limiting | 10 req/menit pada endpoint auth |
| HSTS | `max-age=31536000` — browser wajib HTTPS |
| `.env` files | Tidak di-commit ke Git (sudah ada di `.gitignore`) |
