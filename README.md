# NoPMO Tracker

NoPMO Tracker adalah aplikasi komprehensif yang dirancang untuk membantu pengguna melacak kemajuan mereka dalam menghindari konten negatif, dengan dilengkapi ekstensi peramban (browser extension) untuk memblokir situs-situs yang tidak diinginkan secara otomatis.

Proyek ini terdiri dari tiga komponen utama:
1. **Backend** (Python/Flask)
2. **Frontend** (Next.js/React)
3. **Extension** (Chrome Extension)

---

## Struktur Direktori & Dokumentasi File

### 1. Backend (`/backend`)
Backend dibangun menggunakan framework Flask untuk menyediakan RESTful API.
- `requirements.txt` : Daftar dependensi Python yang dibutuhkan (Flask, SQLAlchemy, PyJWT, dll).
- `run.py` : Titik masuk (entry point) utama untuk menjalankan server Flask.
- `init_db.py` : Skrip untuk menginisialisasi database SQLite (membuat tabel-tabel berdasarkan model).
- `.env` : File konfigurasi untuk environment variables (seperti URL database, JWT Secret, dll). *Dikecualikan dari Git*.
- `instance/` : Direktori tempat database lokal (seperti SQLite) dan konfigurasi instance spesifik disimpan. *Dikecualikan dari Git*.
- `venv/` : Direktori Virtual Environment Python. *Dikecualikan dari Git*.

#### `app/` (Modul Utama Aplikasi)
- `__init__.py` : Menginisialisasi aplikasi Flask, konfigurasi ekstensi (Bcrypt, SQLAlchemy, CORS), dan mendaftarkan blueprint untuk routing.
- `config.py` : Berisi class konfigurasi untuk aplikasi Flask.
- `models.py` : Definisi skema database menggunakan SQLAlchemy (contoh: model `User` dan model pelacakan).

#### `app/routes/` (Endpoint API)
- `__init__.py` : Inisialisasi package routing.
- `auth.py` : Endpoint untuk autentikasi pengguna (`/register` dan `/login`), menghasilkan JWT token, dan menyediakan decorator `token_required` untuk proteksi rute.
- `tracker.py` : Endpoint untuk manajemen tracker (mendapatkan status hari ini, rekor terpanjang, dan fungsi `relapse` untuk mereset hari ke 0).
- `blacklist.py` : Endpoint untuk menyuplai daftar domain situs web yang diblokir oleh ekstensi browser.

### 2. Frontend (`/frontend`)
Frontend dibangun dengan framework Next.js untuk menyajikan antarmuka pengguna (UI) yang interaktif.
- `package.json` : Mengelola dependensi npm (Next.js, React, TailwindCSS, Axios, js-cookie, lucide-react) serta skrip proyek.
- `tailwind.config.ts` & `postcss.config.mjs` : Konfigurasi untuk styling menggunakan Tailwind CSS.
- `tsconfig.json` & `next-env.d.ts` : Konfigurasi bahasa TypeScript.

#### `app/` (Halaman & Routing Next.js)
- `globals.css` : File CSS utama untuk mendefinisikan gaya global aplikasi.
- `layout.tsx` : Layout pembungkus utama (root layout) yang merender font, meta tags, dan komponen global.
- `page.tsx` : Halaman utama (Dashboard) setelah login, yang menampilkan progress tracker (hari tanpa relapse), rekor terlama, serta menyediakan tombol reset (intervensi).
- `login/` & `register/` : Direktori berisi halaman autentikasi untuk masuk dan mendaftar pengguna baru.
- `hold-on/` : Halaman peringatan (intervensi) yang akan muncul ketika ekstensi mengarahkan pengguna karena mencoba mengakses situs yang terblokir.

#### `utils/`
- Folder utilitas, berisi konfigurasi klien untuk HTTP request (misalnya instance axios di `api.ts`) untuk berkomunikasi dengan API backend menggunakan token dari cookie.

### 3. Extension (`/extension`)
Ekstensi browser (Manifest V3) yang berfungsi memblokir konten negatif secara otomatis berdasarkan daftar blokir dari backend API.
- `manifest.json` : File konfigurasi esensial ekstensi Chrome yang mendefinisikan nama, versi, background worker, serta perizinan (permissions) seperti `declarativeNetRequest` (untuk memblokir URL) dan `alarms` (untuk sinkronisasi periodik).
- `background.js` : Skrip service worker yang berjalan di background. Skrip ini bertugas mengambil daftar aturan (blacklist) dari API, memprosesnya dengan fungsi `declarativeNetRequest`, dan secara otomatis mengarahkan akses web yang diblokir ke halaman `/hold-on` di frontend. Dilengkapi juga sinkronisasi data secara berkala menggunakan Chrome Alarms.

---

## Cara Menjalankan Proyek (Local Development)

### Backend
1. Masuk ke direktori `backend` (`cd backend`)
2. Buat virtual environment: `python -m venv venv`
3. Aktifkan virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependensi: `pip install -r requirements.txt`
5. Inisialisasi Database: `python init_db.py`
6. Jalankan Server: `python run.py`

### Frontend
1. Masuk ke direktori `frontend` (`cd frontend`)
2. Install dependensi NPM: `npm install`
3. Jalankan development server: `npm run dev`
4. Akses melalui `http://localhost:3000`

### Ekstensi Browser
1. Buka browser berbasis Chromium (Google Chrome, Microsoft Edge, Brave, dll).
2. Pergi ke halaman ekstensi (`chrome://extensions/` atau `edge://extensions/`).
3. Aktifkan **Developer mode** (Mode Pengembang) di pojok kanan atas.
4. Klik tombol **Load unpacked** dan pilih folder `extension/` dari proyek ini.
5. Ekstensi siap bekerja di latar belakang.
