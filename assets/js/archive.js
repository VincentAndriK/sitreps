// Metadata tiap penyakit: judul tampilan + gambar (harus sama dengan index.html)
const DISEASES = {
  PMK: { title: "Penyakit Mulut dan Kuku (PMK)", img: "PMK_sapi.jpg" },
  LSD: { title: "Lumpy Skin Disease (LSD)", img: "LSD_sapi.jpg" },
  Rabies: { title: "Rabies", img: "RABIES_Anjing.jpeg" },
  HPAI: { title: "High Pathogenic Avian Influenza (HPAI)", img: "AI_chicken.jpg" },
  Anthraks: { title: "Anthraks", img: "ANTHRAKS_sapi PO.jpg" },
  SE: { title: "Septicaemia Epizootica (SE)", img: "SE_kerbau.jpeg" },
  Jembrana: { title: "Penyakit Jembrana", img: "JEMBRANA_sapi bali.jpg" },
  ASF: { title: "African Swine Fever (ASF)", img: "asf_dom.jpg" },
  CSF: { title: "Hog Cholera/Classical Swine Fever (CSF)", img: "CSF_dom-pig.jpeg" },
  Brucellosis: { title: "Brucellosis", img: "dairy_brucellosis.jpg" },
  Surra: { title: "Surra (Trypanosomiasis)", img: "Surra_kuda.jpg" },
};

// Bulan pertama laporan tersedia (sama dengan min pada index.html)
const START_YEAR = 2025;
const START_MONTH = 5; // Mei

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function getDiseaseParam() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("disease");
  if (!raw) return null;
  // Cocokkan tanpa membedakan huruf besar/kecil terhadap kunci yang valid
  const key = Object.keys(DISEASES).find(
    d => d.toLowerCase() === raw.toLowerCase()
  );
  return key || null;
}

// Bulan laporan terakhir yang mungkin ada = bulan sebelum bulan berjalan
function getLatestReport() {
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 1; // 1-12
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

// Cek apakah file ada di server tanpa mengunduh isinya.
async function fileExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Bangun daftar bulan yang FILE-nya benar-benar ada, dikelompokkan per tahun.
async function buildAvailableMonthsByYear(disease) {
  const latest = getLatestReport();
  const checks = [];

  let y = START_YEAR;
  let m = START_MONTH;
  while (y < latest.year || (y === latest.year && m <= latest.month)) {
    const cy = y;
    const cm = m;
    const mm = String(cm).padStart(2, "0");
    const url = `./${disease}/${cy}${mm}.html`;
    checks.push(fileExists(url).then(exists => ({ year: cy, month: cm, exists })));
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  const results = await Promise.all(checks);
  const byYear = {};
  results.filter(r => r.exists).forEach(({ year, month }) => {
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(month);
  });
  return byYear;
}

async function renderArchive() {
  const disease = getDiseaseParam();
  const container = document.getElementById("archive-content");
  const titleEl = document.getElementById("disease-title");
  const imgEl = document.getElementById("disease-image");

  if (!disease) {
    document.title = "Arsip Laporan - Penyakit tidak ditemukan";
    titleEl.textContent = "Penyakit tidak ditemukan";
    container.innerHTML =
      '<p class="archive-empty">Parameter penyakit tidak valid. ' +
      '<a href="index.html">Kembali ke beranda</a>.</p>';
    return;
  }

  const meta = DISEASES[disease];
  document.title = "Arsip Laporan " + meta.title;
  titleEl.textContent = "Arsip Laporan " + meta.title;
  imgEl.src = "./assets/img/" + meta.img;
  imgEl.alt = disease;

  container.innerHTML = '<p class="archive-empty">Memuat daftar laporan…</p>';

  const byYear = await buildAvailableMonthsByYear(disease);
  const years = Object.keys(byYear).sort((a, b) => a - b);

  if (years.length === 0) {
    container.innerHTML =
      '<p class="archive-empty">Belum ada laporan yang tersedia untuk penyakit ini.</p>';
    return;
  }

  let html = "";
  years.forEach(year => {
    const months = byYear[year].slice().sort((a, b) => a - b);
    html += '<section class="archive-year">';
    html += "<h2>" + year + "</h2>";
    html += '<ul class="archive-month-list">';
    months.forEach(month => {
      const mm = String(month).padStart(2, "0");
      const href = "./" + disease + "/" + year + mm + ".html";
      html +=
        '<li><a class="archive-month" href="' + href + '">' +
        NAMA_BULAN[month - 1] + "</a></li>";
    });
    html += "</ul></section>";
  });

  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", renderArchive);
