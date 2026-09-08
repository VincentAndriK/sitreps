const DISEASES = [
  "PMK", "LSD", "Rabies", "HPAI", "Anthraks",
  "SE", "Jembrana", "ASF", "CSF", "Brucellosis", "Surra"
];

// Batas paling awal untuk penelusuran mundur (aman untuk semua penyakit).
const MIN_YEAR = 2025;
const MIN_MONTH = 1;

function getMonthName(monthIndex) {
  const arrayBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return arrayBulan[monthIndex];
}

function codeFromYm(year, month) {
  return `${year}${String(month).padStart(2, "0")}`;
}

function prevMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 };
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

// Telusuri mundur dari (startYear, startMonth) sampai menemukan file yang ada.
async function findLatestForDisease(disease, startYear, startMonth) {
  let y = startYear;
  let m = startMonth;
  while (y > MIN_YEAR || (y === MIN_YEAR && m >= MIN_MONTH)) {
    const url = `./${disease}/${codeFromYm(y, m)}.html`;
    if (await fileExists(url)) {
      return { year: y, month: m };
    }
    const p = prevMonth(y, m);
    y = p.year;
    m = p.month;
  }
  return null;
}

function setLink($link, disease, latest) {
  if (latest) {
    $link
      .attr("href", `./${disease}/${codeFromYm(latest.year, latest.month)}.html`)
      .removeClass("disabled")
      .css("pointer-events", "")
      .text("Kunjungi");
  } else {
    $link
      .removeAttr("href")
      .addClass("disabled")
      .css("pointer-events", "none")
      .text("Belum tersedia");
  }
}

async function updateLinksAuto(startYear, startMonth) {
  const results = await Promise.all(
    DISEASES.map(async disease => ({
      disease,
      latest: await findLatestForDisease(disease, startYear, startMonth)
    }))
  );

  let displayYear = 0;
  let displayMonth = 0;
  results.forEach(({ disease, latest }) => {
    setLink($("." + disease + " .report-link"), disease, latest);
    if (latest && (
      latest.year > displayYear ||
      (latest.year === displayYear && latest.month > displayMonth)
    )) {
      displayYear = latest.year;
      displayMonth = latest.month;
    }
  });

  return displayYear > 0 ? { year: displayYear, month: displayMonth } : null;
}

async function loadFirst() {
  const today = new Date();
  const target = today.getMonth() === 0
    ? { year: today.getFullYear() - 1, month: 12 }
    : { year: today.getFullYear(), month: today.getMonth() };

  const reportMonthValue = `${target.year}-${String(target.month).padStart(2, "0")}`;
  $("#report-month")
    .val(reportMonthValue)
    .attr("min", "2025-05")
    .attr("max", reportMonthValue);

  // Judul sementara pakai bulan target agar tidak kosong saat menunggu HEAD.
  $(".bulanIni").text(`${getMonthName(target.month - 1)} ${target.year}`);

  const display = await updateLinksAuto(target.year, target.month);
  if (display) {
    $(".bulanIni").text(`${getMonthName(display.month - 1)} ${display.year}`);
  }
}

async function onReport() {
  const reportMonth = $("#report-month").val();
  if (!reportMonth) {
    alert("Silakan pilih bulan terlebih dahulu. / Please select a month first.");
    return;
  }

  const [yearStr, monthStr] = reportMonth.split("-");
  const yr = parseInt(yearStr, 10);
  const mo = parseInt(monthStr, 10);

  // Untuk bulan yang dipilih: kalau filenya ada, pakai itu. Kalau belum ada,
  // mundur ke bulan sebelumnya yang tersedia agar tombol tetap fungsional.
  const results = await Promise.all(
    DISEASES.map(async disease => ({
      disease,
      latest: await findLatestForDisease(disease, yr, mo)
    }))
  );

  results.forEach(({ disease, latest }) => {
    setLink($("." + disease + " .report-link"), disease, latest);
  });

  $(".bulanIni").text(`${getMonthName(mo - 1)} ${yr}`);

  Swal.fire({
    title: "Data berhasil diperbaharui!",
    icon: "success"
  });
}
