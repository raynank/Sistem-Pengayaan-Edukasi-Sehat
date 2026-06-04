# Sistem Pengayaan Edukasi Internet Sehat

**Internet Sehat** adalah sebuah aplikasi web dan ekstensi peramban (browser) yang dirancang untuk membantu pengguna mengontrol kebiasaan berselancar di internet, menghindari konten negatif (seperti judi online atau situs terlarang lainnya), serta membangun kebiasaan positif melalui sistem pelacakan pencapaian beruntun (*streak tracking*). 

Secara infrastruktur, sistem ini dijalankan secara terisolasi menggunakan **tiga Virtual Machine (VM)** Ubuntu Server yang di-provisioning secara otomatis melalui **Vagrant** dan dikonfigurasi dengan **Ansible**. Masing-masing VM memiliki tanggung jawab khusus: Database, Backend, dan Frontend.

## Bagan Alur Kerja Aplikasi

1. **Sinkronisasi Data (Backend & Database):** Backend (Flask) mengambil daftar domain terlarang dari sumber terpercaya (dataset *Trust Positif*) dan menyimpannya secara terpusat di Database (PostgreSQL).
2. **Pemantauan Akses (Chrome Extension):** Ekstensi Chrome yang terpasang di peramban pengguna akan memantau URL yang diakses. Ekstensi ini secara rutin mengambil daftar domain terlarang (*blacklist*) terbaru dari Backend via API.
3. **Intervensi (Pemblokiran & Pengalihan):** Jika pengguna secara sengaja atau tidak sengaja mencoba mengakses situs yang masuk dalam *blacklist*, Ekstensi Chrome akan seketika memblokir akses tersebut dan mengalihkan pengguna ke halaman utama aplikasi (**Frontend**).
4. **Edukasi dan Gamifikasi (Frontend):** Pada halaman Frontend (Next.js), pengguna diberikan pesan peringatan dan edukasi. Halaman ini juga berfungsi sebagai dasbor interaktif tempat pengguna melacak kemajuan *streak* (hari beruntun tanpa membuka situs negatif) untuk menjaga motivasi.

---

## 1. Arsitektur Infrastruktur

Project menggunakan tiga VM terpisah yang dikelola oleh Vagrant.

| VM | Hostname | IP | Service Utama | Port |
|---|---|---:|---|---:|
| Database | `cc-db` | `192.168.56.10` | PostgreSQL via Docker | `5432` |
| Backend | `cc-be` | `192.168.56.11` | Flask, Gunicorn, dan Nginx via Docker Compose | `80` |
| Frontend | `cc-fe` | `192.168.56.12` | Next.js via Docker | `80` |

---

## 2. Persiapan Environment

Pastikan software berikut sudah terinstall di komputer host (Windows):
1. **Oracle VirtualBox** (https://www.virtualbox.org/wiki/Downloads)
2. **Vagrant** (https://www.vagrantup.com/downloads)

Setelah install, verifikasi di PowerShell:
```powershell
vagrant --version
```

### Konfigurasi File Environment (`.env`)

Sebelum menjalankan aplikasi, Anda wajib membuat file `.env` di folder `database/` dan `backend/` dengan menyalin template contoh yang telah disediakan:

1. **Database `.env`**:
   * Salin file [database/.env_example](file:///c:/Users/raiha/Raynan/Kuliah/Semester%204/CC/tubes2/database/.env_example) menjadi `.env` di folder yang sama.
   * Command (PowerShell/Bash):
     ```bash
     cp database/.env_example database/.env
     ```
2. **Backend `.env`**:
   * Salin file [backend/.env_example](file:///c:/Users/raiha/Raynan/Kuliah/Semester%204/CC/tubes2/backend/.env_example) menjadi `.env` di folder yang sama.
   * Command (PowerShell/Bash):
     ```bash
     cp backend/.env_example backend/.env
     ```

---

## 3. Menjalankan Aplikasi dengan Vagrant

Buka PowerShell di folder root project, lalu jalankan:

```powershell
vagrant up
```

Perintah ini akan secara otomatis:
1. Mendownload base image Ubuntu 22.04.
2. Membuat 3 VM di VirtualBox dan mengonfigurasi IP address.
3. Menjalankan Ansible (di dalam VM) untuk menginstal Docker, menjalankan PostgreSQL, melakukan build Nginx+Flask, dan menjalankan frontend Next.js.

> **Catatan:** Proses pertama kali membutuhkan waktu beberapa menit karena sistem akan mengunduh dependencies dan build Docker images.

---

## 4. Verifikasi Aplikasi

Setelah perintah `vagrant up` selesai, aplikasi langsung dapat diakses!

### A. Tes Frontend dari Browser
Buka browser dan akses:
👉 **http://192.168.56.12**

### B. Tes Backend Health Check
Buka browser dan akses:
👉 **http://192.168.56.11/health**

*(Akan menampilkan respons JSON `{"status": "ok"}`)*

### C. Tes Backend Blacklist API
Buka browser dan akses:
👉 **http://192.168.56.11/api/blacklist/**

---

## 5. Memasang Chrome Extension

1. Buka browser Chrome dan akses halaman: `chrome://extensions`
2. Aktifkan **Developer mode** (pojok kanan atas).
3. Klik **Load unpacked**.
4. Pilih folder `extension` yang ada di dalam repository proyek ini.
5. Selesai! Chrome extension sudah terpasang dan akan secara otomatis menggunakan API backend (http://192.168.56.11).

> [!WARNING]
> **Keterbatasan Ekstensi Chrome:** Karena ekstensi ini masih dalam tahap pengembangan dan harus dipasang menggunakan **Developer Mode** (belum dipublikasikan secara resmi di Chrome Web Store), terdapat beberapa keterbatasan. Mekanisme pemblokiran dan pengalihan halaman mungkin tidak selalu bekerja 100% konsisten atau sempurna di semua kondisi dikarenakan restriksi keamanan bawaan Chrome terhadap ekstensi berstatus *unpacked*.

---

## 6. Perintah Vagrant yang Sering Digunakan

Buka terminal di root project untuk menjalankan perintah berikut:

| Perintah | Fungsi |
|---|---|
| `vagrant up` | Buat dan jalankan semua VM |
| `vagrant halt` | Matikan (shutdown) semua VM |
| `vagrant destroy -f` | Hapus semua VM (menghapus data) |
| `vagrant status` | Cek status nyala/mati VM |
| `vagrant ssh db` | Masuk ke terminal VM Database |
| `vagrant ssh backend` | Masuk ke terminal VM Backend |
| `vagrant ssh frontend` | Masuk ke terminal VM Frontend |

---

## 7. Troubleshooting (Akses Manual VM)

Jika ingin masuk ke VM atau memeriksa log Docker secara manual:

```bash
# Masuk ke VM Backend
vagrant ssh backend

# Melihat log aplikasi backend
docker logs internetsehat_flask

# Masuk ke VM Database
vagrant ssh db

# Masuk ke postgresql CLI
docker exec -it internetsehat_db psql -U internetsehat_user -d internetsehat_db
```

---

## 8. Sinkronisasi Dataset Blacklist (Manual)

Secara default, database PostgreSQL hanya diisi dengan beberapa domain uji coba saat inisialisasi pertama kali. Untuk menyinkronkan daftar domain terlarang yang lengkap (misalnya daftar domain judi online dari *Trust Positif*), Anda perlu menjalankan skrip sinkronisasi secara manual.

Jalankan perintah berikut di PowerShell dari folder root project (host):

```powershell
vagrant ssh backend -c "cd /home/vagrant/app/backend && docker exec internetsehat_flask python sync_blacklist.py"
```

Skrip ini akan mengunduh dataset secara live, memprosesnya dalam batch, dan menyimpannya ke dalam database. Jika database sudah terisi, skrip akan secara otomatis melewati domain yang sudah ada (*ON CONFLICT DO NOTHING*) untuk menghemat waktu dan resource.







