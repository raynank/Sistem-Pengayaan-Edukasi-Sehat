# NoPMO Tracker

NoPMO Tracker adalah aplikasi komprehensif yang dirancang untuk membantu pengguna melacak kemajuan mereka dalam menghindari konten negatif, dengan dilengkapi ekstensi peramban (browser extension) untuk memblokir situs-situs yang tidak diinginkan secara otomatis.

Proyek ini terdiri dari tiga komponen utama:
1. **Backend** (Python/Flask + Gunicorn)
2. **Frontend** (Next.js/React)
3. **Extension** (Chrome Extension)

---

## Arsitektur Production (3-VM + Docker)

```
[ Internet / Browser Extension ]
          │
          ▼
[ vm-frontend ]  ──── HTTPS ────▶  [ vm-backend ]  ──── TCP:5432 ────▶  [ vm-database ]
  Sumopod (Public IP)               192.168.1.11                          192.168.1.10
  Next.js : port 3000               Nginx : port 80/443                   PostgreSQL : 5432
  Domain dikonfigurasi user         └── Flask+Gunicorn : port 5000 (internal)
```

| VM | IP | Peran |
|---|---|---|
| `vm-database` | `192.168.1.10` | PostgreSQL 16 |
| `vm-backend` | `192.168.1.11` | Flask + Gunicorn + Nginx (reverse proxy) |
| `vm-frontend` | Public IP (Sumopod) | Next.js |

---

## Struktur Direktori & Dokumentasi File

### 1. Backend (`/backend`)
Backend dibangun menggunakan framework Flask untuk menyediakan RESTful API.
- `requirements.txt` : Daftar dependensi Python yang dibutuhkan (Flask, SQLAlchemy, PyJWT, dll).
- `run.py` : Titik masuk (entry point) utama untuk menjalankan server Flask.
- `init_db.py` : Skrip untuk menginisialisasi database PostgreSQL (membuat tabel dan seed data awal).
- `Dockerfile` : Build image Flask + Gunicorn untuk production Docker.
- `docker-compose.yml` : Orkestrasi container Flask dan Nginx di vm-backend.
- `.env.example` : Template environment variables (salin ke `.env` saat deploy).
- `nginx/default.conf` : Konfigurasi Nginx sebagai reverse proxy + HTTPS (Let's Encrypt).

#### `app/` (Modul Utama Aplikasi)
- `__init__.py` : Menginisialisasi aplikasi Flask, konfigurasi ekstensi (Bcrypt, SQLAlchemy, CORS), dan mendaftarkan blueprint untuk routing.
- `config.py` : Berisi class konfigurasi untuk aplikasi Flask (membaca `DATABASE_URL` dan `SECRET_KEY` dari environment).
- `models.py` : Definisi skema database menggunakan SQLAlchemy (model `User`, `RelapseLog`, `BlacklistDomain`).

#### `app/routes/` (Endpoint API)
- `auth.py` : Endpoint `/api/auth/register` dan `/api/auth/login`, menghasilkan JWT token.
- `tracker.py` : Endpoint `/api/tracker/status` dan `/api/tracker/relapse` untuk manajemen streak.
- `blacklist.py` : Endpoint `/api/blacklist/` untuk menyuplai daftar domain ke ekstensi browser.

### 2. Frontend (`/frontend`)
Frontend dibangun dengan framework Next.js untuk menyajikan antarmuka pengguna (UI) yang interaktif.
- `package.json` : Mengelola dependensi npm (Next.js, React, TailwindCSS, Axios, js-cookie).
- `next.config.js` : Konfigurasi Next.js dengan `output: 'standalone'` untuk Docker.
- `Dockerfile` : Multi-stage build Next.js untuk production Docker.
- `docker-compose.yml` : Orkestrasi container frontend di vm-frontend.
- `.env.example` : Template environment variables frontend.
- `tailwind.config.ts` & `postcss.config.mjs` : Konfigurasi styling Tailwind CSS.

#### `app/` (Halaman & Routing Next.js)
- `globals.css` : File CSS utama untuk mendefinisikan gaya global aplikasi.
- `layout.tsx` : Layout pembungkus utama (root layout).
- `page.tsx` : Halaman utama (Dashboard) — menampilkan progress tracker dan tombol reset.
- `login/` & `register/` : Halaman autentikasi pengguna.
- `hold-on/` : Halaman peringatan intervensi (redirect target dari ekstensi).

#### `utils/`
- `api.ts` : Instance axios yang membaca `NEXT_PUBLIC_API_URL` dari environment untuk komunikasi ke backend.

### 3. Extension (`/extension`)
Ekstensi browser (Manifest V3) yang memblokir konten negatif berdasarkan blacklist dari backend API.
- `manifest.json` : Konfigurasi ekstensi Chrome (permissions, background worker).
- `background.js` : Service worker yang mengambil blacklist dari API, menerapkan aturan `declarativeNetRequest`, dan mengarahkan akses ke halaman `/hold-on`.

### 4. Database (`/database`)
Konfigurasi Docker untuk PostgreSQL di vm-database.
- `docker-compose.yml` : Menjalankan container PostgreSQL 16.
- `.env.example` : Template kredensial database.

---

## Deployment Production (3-VM Docker)

> Dokumentasi lengkap arsitektur dan keputusan desain ada di [PRD.md](./PRD.md).

### Prasyarat
- Docker 24.x+ dan Docker Compose v2 di semua VM
- Domain aktif dengan DNS A record ke IP Sumopod (vm-frontend)
- Subdomain `api.yourdomain.com` diarahkan ke IP vm-backend

### Langkah 1 — Deploy `vm-database` (192.168.1.10)

```bash
# Di vm-database
cd database/
cp .env.example .env
# Edit .env — isi POSTGRES_PASSWORD dengan password kuat
nano .env

docker compose up -d

# Verifikasi database berjalan
docker exec -it nopmo_db psql -U nopmo_user -d nopmo_db -c "\dt"
```

### Langkah 2 — Deploy `vm-backend` (192.168.1.11)

```bash
# Di vm-backend
cd backend/
cp .env.example .env
# Edit .env — isi SECRET_KEY dan DATABASE_URL dengan kredensial aktual
nano .env

# Dapatkan SSL certificate dari Let's Encrypt (sebelum jalankan docker compose)
apt install certbot -y
certbot certonly --standalone -d api.yourdomain.com
# Ganti 'yourdomain.com' di nginx/default.conf dengan domain aktual
nano nginx/default.conf

docker compose up -d

# Inisialisasi database (buat tabel + seed blacklist)
docker exec nopmo_flask python init_db.py

# Verifikasi API berjalan
curl https://api.yourdomain.com/api/blacklist/
```

### Langkah 3 — Deploy `vm-frontend` (Sumopod)

```bash
# Di vm-frontend / Sumopod
cd frontend/
# Ganti 'yourdomain.com' di docker-compose.yml dengan domain aktual
nano docker-compose.yml

docker compose up -d

# Verifikasi frontend berjalan
curl http://localhost:3000
```

### Langkah 4 — Update Extension

Edit `extension/background.js` — ganti `yourdomain.com` dengan domain aktual:

```js
const API_URL = "https://api.yourdomain.com/api/blacklist/";
const REDIRECT_URL = "https://yourdomain.com/hold-on";
```

Kemudian reload extension di browser (`chrome://extensions/` → klik ikon refresh).

---

## Cara Menjalankan Proyek (Local Development)

### Backend
1. Masuk ke direktori `backend` (`cd backend`)
2. Buat virtual environment: `python -m venv venv`
3. Aktifkan virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependensi: `pip install -r requirements.txt`
5. Buat file `.env` dengan `SECRET_KEY` dan `DATABASE_URL` (bisa SQLite: `sqlite:///nopmo.db`)
6. Inisialisasi Database: `python init_db.py`
7. Jalankan Server: `python run.py`

### Frontend
1. Masuk ke direktori `frontend` (`cd frontend`)
2. Buat file `.env.local` dengan `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
3. Install dependensi NPM: `npm install`
4. Jalankan development server: `npm run dev`
5. Akses melalui `http://localhost:3000`

### Ekstensi Browser
1. Buka browser berbasis Chromium (Google Chrome, Microsoft Edge, Brave, dll).
2. Pergi ke halaman ekstensi (`chrome://extensions/`).
3. Aktifkan **Developer mode** di pojok kanan atas.
4. Klik **Load unpacked** dan pilih folder `extension/` dari proyek ini.
5. Ekstensi siap bekerja di latar belakang.

> **Catatan Development:** Untuk development lokal, kembalikan URL di `extension/background.js` ke `http://localhost:5000` dan `http://localhost:3000`.
