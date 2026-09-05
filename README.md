# WhatsApp Bot with Admin Panel

Sebuah bot WhatsApp lengkap dengan panel admin yang dibangun menggunakan Node.js dan Express.js. Bot ini memiliki kemampuan untuk chat, membalas pesan, mengirim pesan terjadwal, mengirim gambar, melihat dan menyukai status, serta terintegrasi dengan Google Sheets dan Gemini AI.

## Fitur

- **Koneksi WhatsApp**: Menghubungkan ke WhatsApp melalui QR code
- **Chat dan Balas Pesan**: Mengirim dan menerima pesan teks dan gambar
- **Pesan Terjadwal**: Menjadwalkan pengiriman pesan untuk waktu tertentu
- **Status WhatsApp**: Melihat dan menyukai status kontak
- **Integrasi Google Sheets**: Membaca dan menulis data ke Google Sheets
- **Integrasi Gemini AI**: Menggunakan AI untuk menghasilkan respons otomatis
- **Panel Admin**: Antarmuka web untuk mengelola semua fitur bot
- **API**: Endpoint API untuk integrasi dengan sistem lain

## Persyaratan Sistem

- Node.js (versi 14 atau lebih tinggi)
- NPM (versi 6 atau lebih tinggi)
- Koneksi internet stabil
- Perangkat dengan WhatsApp terinstal (untuk pemindaian QR code)

## Instalasi

1. Clone repositori ini atau download file zip

2. Instal dependensi
   ```
   npm install
   ```

3. Salin file `.env.example` ke `.env` dan isi dengan konfigurasi Anda
   ```
   cp .env.example .env
   ```

4. Jalankan aplikasi
   ```
   npm start
   ```

5. Buka browser dan akses `http://localhost:3000`

## Konfigurasi

Edit file `.env` untuk mengonfigurasi aplikasi:

```
# Server Configuration
PORT=3000
SESSION_SECRET=your_session_secret

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# API Configuration
API_SECRET=your_api_secret

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Google Sheets Configuration
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key
GOOGLE_SHEETS_ID=your_google_sheets_id
```

## Penggunaan

### Panel Admin

1. Buka browser dan akses `http://localhost:3000`
2. Login dengan kredensial admin (default: admin/admin123)
3. Gunakan menu navigasi untuk mengakses fitur-fitur bot:
   - Dashboard: Ringkasan status dan aktivitas bot
   - WhatsApp Connection: Menghubungkan ke WhatsApp melalui QR code
   - Send Message: Mengirim pesan teks atau gambar
   - Chats: Melihat dan membalas chat
   - Status: Melihat dan menyukai status kontak
   - Scheduled Messages: Mengelola pesan terjadwal
   - Settings: Mengonfigurasi Google Sheets dan Gemini AI

### API

API tersedia untuk integrasi dengan sistem lain. Semua endpoint API memerlukan header autentikasi:

```
Authorization: Bearer your_api_secret
```

Endpoint API yang tersedia:

- `GET /api/whatsapp/status`: Mendapatkan status koneksi WhatsApp
- `POST /api/whatsapp/send`: Mengirim pesan teks
- `POST /api/whatsapp/send-image`: Mengirim pesan gambar
- `GET /api/whatsapp/chats`: Mendapatkan daftar chat
- `GET /api/scheduler`: Mendapatkan daftar pesan terjadwal
- `POST /api/scheduler`: Menambahkan pesan terjadwal baru
- `DELETE /api/scheduler/:id`: Membatalkan pesan terjadwal
- `PUT /api/scheduler/:id`: Memperbarui pesan terjadwal
- `GET /api/sheets/read`: Membaca data dari Google Sheets
- `POST /api/sheets/write`: Menulis data ke Google Sheets
- `POST /api/sheets/append`: Menambahkan data ke Google Sheets
- `GET /api/sheets/sheets`: Mendapatkan daftar nama sheet
- `POST /api/ai/generate`: Menghasilkan respons AI

## Hosting di cPanel

Untuk meng-host aplikasi ini di cPanel:

1. Upload semua file ke direktori di server cPanel Anda

2. Buat file `.htaccess` di direktori root dengan konten berikut:
   ```
   RewriteEngine On
   RewriteRule ^$ http://localhost:3000/ [P,L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
   ```

3. Buat Node.js App di cPanel:
   - Buka cPanel > Setup Node.js App
   - Pilih direktori aplikasi Anda
   - Set Node.js version (14 atau lebih tinggi)
   - Set Application mode: Production
   - Set Application URL: /
   - Set Application startup file: app.js

4. Klik Create dan kemudian Start aplikasi

## Pemecahan Masalah

### Koneksi WhatsApp Terputus

1. Pastikan perangkat yang digunakan untuk memindai QR code memiliki koneksi internet stabil
2. Pastikan WhatsApp Web tidak terbuka di browser lain
3. Coba pindai ulang QR code dari panel admin

### Pesan Terjadwal Tidak Terkirim

1. Pastikan bot terhubung ke WhatsApp
2. Periksa format nomor telepon (gunakan format internasional: 628xxxxxxxxxx)
3. Periksa log server untuk error

### Integrasi Google Sheets Tidak Berfungsi

1. Pastikan API key valid dan memiliki akses ke Google Sheets API
2. Pastikan ID Sheet benar dan dapat diakses oleh API key
3. Gunakan fitur "Test Connection" di panel admin untuk mendiagnosis masalah

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

## Kontak

Jika Anda memiliki pertanyaan atau masalah, silakan buka issue di repositori ini atau hubungi pengembang.