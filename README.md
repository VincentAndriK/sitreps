# Sitreps Penyakit Hewan

Situs statis untuk menampilkan **Situation Reports (SITREPS)** bulanan 11
penyakit hewan prioritas di Indonesia, berbasis data dari iSIKHNAS.

Halaman utama menampilkan laporan **bulan terakhir yang tersedia** untuk
tiap penyakit, dengan arsip lengkap per tahun yang otomatis mengikuti file
yang benar-benar sudah diupload.

## Struktur

```
.
├── index.html                  # Landing page: 11 kartu penyakit
├── archive.html                # Halaman arsip per-penyakit
├── assets/
│   ├── css/                    # Stylesheet (style, styling, img)
│   ├── js/                     # Script (script, archive, bootstrap, flexdashboard, dst.)
│   └── img/                    # Foto penyakit di landing page
├── PMK/                        # Folder per penyakit
│   ├── 202505.html             # Laporan bulanan (YYYYMM.html)
│   ├── 202506.html
│   └── ...
├── LSD/  Rabies/  HPAI/  Anthraks/  SE/  Jembrana/
├── ASF/  CSF/  Brucellosis/  Surra/
└── tools/
    └── optimize_report.py      # Tool untuk mengecilkan file laporan baru
```

Setiap file laporan bulanan mengikuti format `YYYYMM.html` (mis.
`202608.html` untuk Agustus 2026). Rentang minimum yang didukung UI:
Mei 2025.

## Fitur utama

### Auto-detect laporan terakhir

Tombol **Kunjungi** di [index.html](index.html) tidak hard-code ke bulan
tertentu. Saat halaman dimuat, JavaScript mengecek keberadaan file
`YYYYMM.html` di setiap folder penyakit lewat `fetch HEAD`, mundur bulan
per bulan sampai menemukan yang benar-benar ada. Jadi bila `202608.html`
belum diupload, tombol otomatis mengarah ke `202607.html`, dan **berpindah
sendiri** begitu `202608.html` ditambahkan — tanpa edit kode.

### Arsip hanya yang tersedia

[archive.html](archive.html) mengecek satu per satu (paralel) bulan dari
Mei 2025 sampai bulan lalu, dan **hanya menampilkan bulan yang filenya
benar-benar ada**. Bulan yang belum diupload tidak muncul.

Logika ini ada di:
- [assets/js/script.js](assets/js/script.js) — `loadFirst()`, `onReport()`
- [assets/js/archive.js](assets/js/archive.js) — `buildAvailableMonthsByYear()`

## Menjalankan lokal

Butuh HTTP server (bukan buka file `.html` langsung dari file explorer,
karena `fetch` diblokir di `file://`).

```bash
python -m http.server 8123
```

Lalu buka http://localhost:8123.

Config `.claude/launch.json` sudah menyiapkan perintah ini untuk pengguna
Claude Code.

## Menambah laporan bulan baru

1. Hasilkan 11 file HTML baru (satu per penyakit) dari generator R
   flexdashboard, namai dengan `YYYYMM.html`.
2. Letakkan setiap file di folder penyakit yang sesuai
   (`PMK/202609.html`, `LSD/202609.html`, dst.).
3. **Kecilkan ukurannya** dengan tool bawaan (lihat bagian berikut).
4. Selesai. Landing page dan arsip otomatis mendeteksinya.

## Optimasi file laporan baru

File mentah dari flexdashboard bisa mencapai ~3 MB per file karena
meng-inline seluruh Bootstrap, jQuery, FlexDashboard runtime, dan logo
sebagai base64. [tools/optimize_report.py](tools/optimize_report.py)
memindahkan blok-blok yang sama itu ke `assets/css/` dan `assets/js/`
supaya di-share antar semua laporan, memangkas ukuran ~86%.

Jalankan untuk semua penyakit:

```bash
python tools/optimize_report.py 202609
```

Atau subset saja:

```bash
python tools/optimize_report.py 202609 PMK LSD
```

Tool ini idempotent — aman dijalankan berulang; file yang sudah dioptimasi
tidak berubah.

## Deploy

Repositori disiapkan bisa jalan di dua tempat:

1. **Hostinger** — folder di-serve dari `public_html/sitreps/`, diakses
   di `https://vincentandrik.my.id/sitreps/`. Bisa auto-deploy via
   integrasi GitHub App di hPanel (Website → Tingkat Lanjut → GIT), atau
   upload manual via File Manager.
2. **GitHub Pages** — enable di Settings → Pages → source: `main` /
   `(root)`, diakses di `https://vincentandrik.github.io/sitreps/`.

Karena semua link internal pakai path relatif, kedua deployment berjalan
tanpa modifikasi.

## Kredit

Data diolah dari **iSIKHNAS**. Situs ini milik Direktorat Jenderal
Peternakan dan Kesehatan Hewan, Kementerian Pertanian Republik Indonesia.
