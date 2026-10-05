# Changelog

Semua perubahan penting proyek ini dicatat di file ini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/),
dan versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

## [0.2.1] - 2026-10-05

### Added
- Laporan bulan **September 2026** (`202609.html`) untuk 11 penyakit.

## [0.2.0] - 2026-09-08

### Added
- **Auto-detect laporan terakhir** di landing page. `loadFirst()` dan
  `onReport()` di [assets/js/script.js](assets/js/script.js) mengecek
  keberadaan file `YYYYMM.html` per penyakit lewat `fetch HEAD` dan
  menset tombol *Kunjungi* ke bulan terbaru yang benar-benar ada.
- **Arsip dinamis** di [archive.html](archive.html). Fungsi
  `buildAvailableMonthsByYear()` di
  [assets/js/archive.js](assets/js/archive.js) hanya menampilkan bulan
  yang filenya ada di server (bulan yang belum diupload tidak muncul).
- **Tool optimasi laporan bulanan**
  [tools/optimize_report.py](tools/optimize_report.py) — idempotent,
  memindahkan blok Bootstrap CSS/JS, jQuery, FlexDashboard runtime, dan
  logo header dari inline ke file bersama di `assets/`. Cara pakai:
  `python tools/optimize_report.py YYYYMM [DISEASE ...]`.
- File JS bersama yang diekstrak: `assets/js/flexdashboard.js` (49.7 KB),
  `assets/js/html5shiv.js` (2.7 KB), `assets/js/respond.js` (4.5 KB),
  `assets/js/jquery.stickytableheaders.js` (5.2 KB).
- Laporan bulan **Agustus 2026** (`202608.html`) untuk 11 penyakit.
- File `README.md` dan `CHANGELOG.md`.
- `.gitignore` dasar.

### Changed
- **Ukuran file laporan Agustus 2026** dipangkas dari ~3 MB → ~300 KB per
  file (~86% lebih kecil) dengan meng-eksternalisasi CSS/JS/logo bersama.
  Total dari ~32.8 MB jadi ~3.7 MB.
- Semua `202608.html` sekarang mereferensikan `assets/css/styling.css`
  dan `assets/js/bootstrap.js` yang sebelumnya sudah dipakai file
  `202607.html`, alih-alih meng-inline versi duplikat.
- `<title>` dan `og:title` di `ASF/202608.html`, `CSF/202608.html`, dan
  `LSD/202608.html` diseragamkan dari `Dashboard_XXX` menjadi
  `Laporan Perkembangan XXX`.

### Removed
- File duplikat `assets/css/flexdashboard.css` yang isinya subset dari
  `assets/css/styling.css`.

## [0.1.0] - 2026-07 (initial)

### Added
- Landing page [index.html](index.html) dengan 11 kartu penyakit
  prioritas dan input pilih bulan (min: 2025-05).
- [archive.html](archive.html) dengan parameter `?disease=XXX`.
- Aset CSS/JS/gambar di `assets/`.
- Laporan bulanan Mei 2025 – Juli 2026 untuk seluruh penyakit.

[Unreleased]: https://github.com/VincentAndriK/sitreps/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/VincentAndriK/sitreps/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/VincentAndriK/sitreps/releases/tag/v0.2.0
[0.1.0]: https://github.com/VincentAndriK/sitreps/releases/tag/v0.1.0
