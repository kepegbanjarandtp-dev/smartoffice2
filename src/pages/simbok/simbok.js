/* ======================================================
   SIMBOK — IMPORT MODULE
====================================================== */
import { smartofficeGetSession } from "../../core/session.js";
import logoSimbok from "../../assets/icons/logo-simbok.svg";
import { smartofficeFirestore } from "../../core/firebase-firestore.js";
import { collection, getDocs } from "firebase/firestore";


/* ======================================================
   SIMBOK — STATE DAN VARIABEL GLOBAL
====================================================== */

/* Menyimpan event listener untuk dibersihkan saat halaman ditutup. */
let simbokHandlers = [];

/* Menyimpan daftar Master Detail Menu selama sesi halaman. */
let simbokMasters = [];

/* Menyimpan rencana bulanan berdasarkan master, tahun, bulan, dan komponen. */
let simbokMonthlyPlans = {};

/* Menyimpan ID master yang sedang diedit. */
let simbokEditingId = null;

/* Menyimpan ID sementara untuk master baru. */
let simbokNextId = 1;

/* Menyimpan ID sementara untuk komponen baru. */
let simbokNextComponentId = 1;

/* Menyimpan elemen yang terakhir mendapatkan fokus. */
let simbokLastFocus = null;


/* ======================================================
   SIMBOK — CACHE MASTER FIRESTORE
====================================================== */

/* Menampung seluruh data referensi simBOK. */
const SIMBOK_REF = {
  menu: [],
  rincian: [],
  rekeningKegiatan: [],
  rekeningBelanja: [],
  satuan: [],
  pegawai: []
};

/* Menandai apakah cache sudah dimuat. */
let simbokCacheLoaded = false;

/* Menyimpan proses pemuatan cache yang sedang berjalan. */
let simbokCachePromise = null;

/* Menandai apakah referensi master sudah dimuat. */
let simbokReferenceLoaded = false;

/* Menyimpan proses pemuatan referensi yang sedang berjalan. */
let simbokReferenceLoadPromise = null;

/* Mengambil seluruh dokumen dari satu collection Firestore. */
async function simbokGetCollection(collectionName) {
  const snapshot = await getDocs(
    collection(smartofficeFirestore, collectionName)
  );

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/* Memuat seluruh master simBOK dan data pegawai ke cache. */
/* Memuat data pegawai ke cache referensi simBOK. */
async function simbokLoadCache() {
  if (simbokCacheLoaded) return;

  if (simbokCachePromise) {
    return simbokCachePromise;
  }

  simbokCachePromise = (async () => {
    const pegawai = await simbokGetCollection("pegawai");

    SIMBOK_REF.pegawai = pegawai
      .map(item => ({
        id: item.id,
        nama: item.nama || "",
        nip: item.nip || item.id
      }))
      .filter(item => item.nama && item.nip)
      .sort((a, b) =>
        a.nama.localeCompare(b.nama, "id")
      );

    simbokCacheLoaded = true;
  })();

  try {
    await simbokCachePromise;
  } catch (error) {
    simbokCacheLoaded = false;
    throw error;
  } finally {
    simbokCachePromise = null;
  }
}

/* Mengambil seluruh dokumen dari collection master Firestore. */
async function simbokGetMasterCollection(collectionName) {
  console.log(`[simBOK] FIRESTORE FETCH: ${collectionName}`);

  const snapshot = await getDocs(
    collection(smartofficeFirestore, collectionName)
  );

  return snapshot.docs.map(document => ({
    id: document.id,
    ...document.data()
  }));
}

/* Memuat lima master referensi dari Firestore. */
async function simbokLoadReferences() {
  if (simbokReferenceLoaded) return;

  if (simbokReferenceLoadPromise) {
    await simbokReferenceLoadPromise;
    return;
  }

  simbokReferenceLoadPromise = (async () => {
    const [
      menu,
      rincian,
      rekeningKegiatan,
      rekeningBelanja,
      satuan
    ] = await Promise.all([
      simbokGetMasterCollection("simbok_master_menu"),
      simbokGetMasterCollection("simbok_master_rincian_menu"),
      simbokGetMasterCollection("simbok_master_rekening_kegiatan"),
      simbokGetMasterCollection("simbok_master_rekening_belanja"),
      simbokGetMasterCollection("simbok_master_satuan")
    ]);

    SIMBOK_REF.menu = menu.map(item => ({
      ...item,
      "KODE MENU": item.kodeMenu ?? item["KODE MENU"] ?? "",
      MENU: item.namaMenu ?? item.MENU ?? item.menu ?? "",
      STATUS: item.status ?? item.STATUS ?? ""
    }));

    SIMBOK_REF.rincian = rincian.map(item => ({
      ...item,
      "KODE MENU": item.kodeMenu ?? item["KODE MENU"] ?? "",
      MENU: item.namaMenu ?? item.MENU ?? "",
      "KODE RINCIAN MENU":
        item.kodeRincianMenu ?? item["KODE RINCIAN MENU"] ?? "",
      "RINCIAN MENU":
        item.namaRincianMenu ?? item["RINCIAN MENU"] ?? "",
      "DEFINISI OPERASIONAL":
        item.definisiOperasional ?? item["DEFINISI OPERASIONAL"] ?? "",
      "KODE REKENING KEGIATAN":
        item.kodeRekeningKegiatan ?? item["KODE REKENING KEGIATAN"] ?? "",
      "NAMA REKENING KEGIATAN":
        item.namaRekeningKegiatan ?? item["NAMA REKENING KEGIATAN"] ?? "",
      STATUS: item.status ?? item.STATUS ?? item.AKTIF ?? ""
    }));

    SIMBOK_REF.rekeningKegiatan = rekeningKegiatan.map(item => ({
      ...item,
      "KODE REKENING KEGIATAN":
        item.kodeRekeningKegiatan ?? item["KODE REKENING KEGIATAN"] ?? "",
      "NAMA REKENING KEGIATAN":
        item.namaRekeningKegiatan ?? item["NAMA REKENING KEGIATAN"] ?? "",
      STATUS: item.status ?? item.STATUS ?? ""
    }));

    SIMBOK_REF.rekeningBelanja = rekeningBelanja.map(item => ({
      ...item,
      "KODE REKENING BELANJA":
        item.kodeRekeningBelanja ?? item["KODE REKENING BELANJA"] ?? "",
      "NAMA REKENING BELANJA":
        item.namaRekeningBelanja ?? item["NAMA REKENING BELANJA"] ?? "",
      "JENIS BELANJA": item.jenisBelanja ?? item["JENIS BELANJA"] ?? "",
      "HARGA SATUAN": item.hargaSatuan ?? item["HARGA SATUAN"] ?? 0,
      SATUAN: item.satuan ?? item.SATUAN ?? "",
      STATUS: item.status ?? item.STATUS ?? ""
    }));

    SIMBOK_REF.satuan = satuan.map(item => ({
      ...item,
      "KELOMPOK SATUAN": item.kelompokSatuan ?? item["KELOMPOK SATUAN"] ?? "",
      "KODE SATUAN": item.kodeSatuan ?? item["KODE SATUAN"] ?? "",
      "NAMA SATUAN": item.namaSatuan ?? item["NAMA SATUAN"] ?? "",
      STATUS: item.status ?? item.STATUS ?? ""
    }));

    simbokReferenceLoaded = true;
  })();

  try {
    await simbokReferenceLoadPromise;
  } finally {
    simbokReferenceLoadPromise = null;
  }
}


/* ======================================================
   SIMBOK — HELPER DAN UTILITAS UMUM
====================================================== */

/* Mengubah angka menjadi format mata uang Rupiah. */
const simbokCurrency = value => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0
}).format(Number(value) || 0);

/* Memastikan nilai yang digunakan merupakan angka valid. */
const simbokNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

/* Mendaftarkan event listener sekaligus menyimpan referensinya. */
function simbokAddHandler(element, eventName, handler) {
  if (!element) return;
  element.addEventListener(eventName, handler);
  simbokHandlers.push([element, eventName, handler]);
}

/* Mengamankan teks sebelum ditampilkan ke HTML. */
function simbokEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}


/* ======================================================
   SIMBOK — NAVIGASI DAN TAB
====================================================== */

/* Mengaktifkan tab utama dan panel yang sesuai. */
function simbokActivateTab(tab, tabs, panels, moveFocus = false) {
  const target = tab.dataset.simbokTab;
  tabs.forEach(item => {
    const active = item === tab;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
  });
  panels.forEach(panel => {
    panel.hidden = panel.dataset.simbokPanel !== target;
  });
  if (moveFocus) tab.focus();
}

/* Mengaktifkan subtab pada halaman perencanaan. */
function simbokActivatePlanTab(tab, tabs, views, moveFocus = false) {
  const target = tab.dataset.planTab;
  tabs.forEach(item => {
    const active = item === tab;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
  });
  views.forEach(view => {
    view.hidden = view.dataset.planView !== target;
  });
  if (moveFocus) tab.focus();
}


/* ======================================================
   SIMBOK — HAK AKSES DAN OTORISASI
====================================================== */

/* Memeriksa apakah pengguna memiliki role SUPERADMIN. */
function simbokIsSuperAdmin() {
  const session = smartofficeGetSession() || {};
  const role = String(
    session.role ||
    session.ROLE ||
    session.userRole ||
    session.akses ||
    session.level ||
    session.hakAkses ||
    ""
  ).trim().toUpperCase().replace(/[\\s-]+/g, "_");

  return role === "SUPERADMIN" || role === "SUPER_ADMIN";
}


/* ======================================================
   SIMBOK — MASTER REFERENSI
====================================================== */

/* Mengisi dropdown Menu dan filter Menu. */
function simbokPopulateReferences() {
  const menu = document.getElementById("simbokMasterMenu");
  const filter = document.getElementById("simbokMasterMenuFilter");

  SIMBOK_REF.menu
    .filter(item => String(item.STATUS).toUpperCase() === "AKTIF")
    .forEach(item => {
      const option = document.createElement("option");
      option.value = item["KODE MENU"];
      option.textContent = `${item["KODE MENU"]} — ${item.MENU}`;
      menu.appendChild(option);

      filter.appendChild(option.cloneNode(true));
    });
}

/* Mengisi dropdown Rincian Menu berdasarkan Menu terpilih dari cache. */
function simbokPopulateRincianOptions(selected = "") {
  const menuCode = document.getElementById("simbokMasterMenu").value;
  const select = document.getElementById("simbokMasterRincian");

  console.log("[simBOK] CACHE FILTER RINCIAN:", menuCode);

  select.innerHTML = '<option value="">Pilih rincian menu</option>';

  const hasil = SIMBOK_REF.rincian.filter(item =>
    String(item["KODE MENU"]).trim() === String(menuCode).trim() &&
    String(item.STATUS).trim().toUpperCase() === "AKTIF"
  );

  console.log("[simBOK] HASIL FILTER CACHE:", hasil.length, "data");

  hasil.forEach(item => {
    const option = document.createElement("option");

    option.value = item["KODE RINCIAN MENU"];
    option.textContent =
      `${item["KODE RINCIAN MENU"]} — ${item["RINCIAN MENU"]}`;

    select.appendChild(option);
  });

  select.disabled = !menuCode;
  select.value = selected;

  simbokUpdateRincianSnapshot();
}

/* Mengisi kode rincian, definisi operasional, dan rekening kegiatan otomatis. */
function simbokUpdateRincianSnapshot() {
  const code = document.getElementById("simbokMasterRincian").value;
  const record = SIMBOK_REF.rincian.find(
    item => item["KODE RINCIAN MENU"] === code
  );

  document.getElementById("simbokMasterKode").value =
    record?.["KODE RINCIAN MENU"] || "";
  // Mengambil Definisi Operasional langsung dari Master Rincian Menu.
  const definisi = document.getElementById("simbokMasterDefinisi");

  definisi.value = record
    ? (record["DEFINISI OPERASIONAL"] ?? "")
    : "";
  document.getElementById("simbokMasterRekKegiatan").value =
    record?.["KODE REKENING KEGIATAN"] || "";
  document.getElementById("simbokMasterNamaRekKegiatan").value =
    record?.["NAMA REKENING KEGIATAN"] || "";
}

/* Mengisi nama rekening kegiatan berdasarkan kode rekening. */
function simbokUpdateNamaRekeningKegiatan() {
  const code = document.getElementById("simbokMasterRekKegiatan").value;
  const account = SIMBOK_REF.rekeningKegiatan.find(
    item => item["KODE REKENING KEGIATAN"] === code
  );

  document.getElementById("simbokMasterNamaRekKegiatan").value =
    account?.["NAMA REKENING KEGIATAN"] || "";
}


/* ======================================================
   SIMBOK — MASTER PEGAWAI
====================================================== */

/* Mengisi dropdown Nama Pemegang Program. */
function simbokPopulatePegawai(selectedNip = "") {
  const select = document.getElementById(
    "simbokMasterPemegang"
  );

  if (!select) return;

  select.innerHTML = `
    <option value="">Pilih nama pegawai</option>
  `;

  SIMBOK_REF.pegawai.forEach(pegawai => {
    const option = document.createElement("option");

    option.value = pegawai.nip;
    option.textContent = pegawai.nama;

    select.appendChild(option);
  });

  select.value = selectedNip;

  simbokUpdatePegawaiTerpilih();
}

/* Mengisi NIP/NRP otomatis berdasarkan pegawai terpilih. */
function simbokUpdatePegawaiTerpilih() {
  const select = document.getElementById(
    "simbokMasterPemegang"
  );

  const nipInput = document.getElementById(
    "simbokMasterNip"
  );

  if (!select || !nipInput) return;

  nipInput.value = select.value || "";
}


/* ======================================================
   SIMBOK — TAB 1: DETAIL MENU / KEGIATAN
====================================================== */

/* ------------------------------------------------------
   MODAL DETAIL MENU
------------------------------------------------------ */

/* Membuka modal tambah atau edit Detail Menu. */
async function simbokOpenMasterModal(id = null) {
  if (!simbokIsSuperAdmin()) return;

  // Pastikan cache sudah tersedia.
  await simbokLoadCache();

  const modal = document.getElementById(
    "simbokMasterModal"
  );

  simbokLastFocus = document.activeElement;

  simbokResetMasterForm();

  if (id !== null) {
    const master = simbokMasters.find(
      item => item.id === id
    );

    if (!master) return;

    simbokEditingId = id;

    document.getElementById("simbokMasterTahun").value =
      master.tahunAnggaran;

    document.getElementById("simbokMasterMenu").value =
      master.kodeMenu;

    simbokPopulateRincianOptions(
      master.kodeRincianMenu
    );

    document.getElementById("simbokMasterDefinisi").value =
      master.definisiOperasional;

    document.getElementById("simbokMasterRekKegiatan").value =
      master.kodeRekeningKegiatan;

    simbokUpdateNamaRekeningKegiatan();

    // Pilih pegawai lama berdasarkan NIP.
    simbokPopulatePegawai(
      master.nipPemegangProgram
    );

    master.komponenBelanja.forEach(item => {
      simbokAddKomponenRow(item);
    });

    document.getElementById(
      "simbokMasterModalTitle"
    ).textContent = "Edit Detail Menu / Kegiatan";

    document.getElementById(
      "simbokSaveMaster"
    ).textContent = "Simpan Perubahan";

  } else {
    document.getElementById("simbokMasterTahun").value =
      document.getElementById("simbokPlanYearMaster").value ||
      2027;

    // Tampilkan daftar pegawai tanpa memilih siapa pun.
    simbokPopulatePegawai();

    simbokAddKomponenRow();

    document.getElementById(
      "simbokMasterModalTitle"
    ).textContent = "Tambah Detail Menu / Kegiatan";

    document.getElementById(
      "simbokSaveMaster"
    ).textContent = "Simpan Detail Menu";
  }

  modal.hidden = false;

  document.body.classList.add("simbok-modal-open");

  document.getElementById("simbokMasterTahun").focus();
}

/* Menutup modal dan mengembalikan fokus ke tombol sebelumnya. */
function simbokCloseMasterModal() {
  document.getElementById("simbokMasterModal").hidden = true;
  document.body.classList.remove("simbok-modal-open");
  simbokResetMasterForm();
  if (simbokLastFocus && typeof simbokLastFocus.focus === "function") simbokLastFocus.focus();
}

/* Mengosongkan form Detail Menu. */
function simbokResetMasterForm() {
  const form = document.getElementById("simbokMasterForm");
  if (!form) return;
  form.reset();
  simbokEditingId = null;
  document.getElementById("simbokMasterRincian").innerHTML =
    '<option value="">Pilih menu terlebih dahulu</option>';
  document.getElementById("simbokMasterRincian").disabled = true;
  document.getElementById("simbokMasterKode").value = "";
  document.getElementById("simbokMasterDefinisi").value = "";
  document.getElementById("simbokMasterNamaRekKegiatan").value = "";
  document.getElementById("simbokKomponenList").innerHTML = "";
  document.getElementById("simbokMasterTotal").textContent = simbokCurrency(0);
}


/* ------------------------------------------------------
   KOMPONEN JENIS BELANJA
------------------------------------------------------ */

/* Menambahkan kartu komponen Jenis Belanja. */
function simbokAddKomponenRow(data = {}) {
  const list = document.getElementById("simbokKomponenList");
  const row = document.createElement("article");

  row.className = "simbok-component-card";
  row.dataset.componentKey = data.key || `komponen-${simbokNextComponentId++}`;

  // Mengambil Jenis Belanja yang berstatus AKTIF.
  const options = SIMBOK_REF.rekeningBelanja
    .filter(item =>
      String(item.STATUS).toUpperCase() === "AKTIF"
    )
    .map(item => {
      const key = `${item["KODE REKENING BELANJA"]}||${item["JENIS BELANJA"]}`;

      return `
        <option value="${simbokEscape(key)}">
          ${simbokEscape(item["JENIS BELANJA"])}
        </option>
      `;
    })
    .join("");

  row.innerHTML = `
    <!-- Header Komponen -->
    <div class="simbok-component-card-head">
      <div>
        <span class="simbok-component-index"></span>
        <h5>Komponen Jenis Belanja</h5>
      </div>

      <button
        type="button"
        class="simbok-plan-remove"
        aria-label="Hapus komponen"
      >×</button>
    </div>

    <div class="simbok-component-grid">

      <!-- BARIS 1: Jenis Belanja dan Rekening -->
      <div class="simbok-component-main-row">

        <label class="simbok-component-type">
          Jenis Belanja
          <select class="simbok-component-account" required>
            <option value="">Pilih jenis belanja</option>
            ${options}
          </select>
        </label>

        <label class="simbok-component-code-field">
          Kode Rekening Belanja
          <input
            class="simbok-component-code"
            type="text"
            readonly
          >
        </label>

        <label class="simbok-component-name-field">
          Nama Rekening Belanja
          <input
            class="simbok-component-name"
            type="text"
            readonly
          >
        </label>

      </div>

      <!-- BARIS 2: Volume Kegiatan -->
      <div class="simbok-component-volume-row">

        <label>
          Jumlah Orang
          <input
            class="simbok-component-people"
            type="number"
            min="1"
            step="1"
            value="1"
            required
          >
        </label>

        <label>
          Satuan Orang
          <input
            class="simbok-component-people-unit"
            value="Orang"
            required
          >
        </label>

        <label>
          Jumlah Lokasi
          <input
            class="simbok-component-location"
            type="number"
            min="1"
            step="1"
            value="1"
            required
          >
        </label>

        <label>
          Satuan Lokasi
          <input
            class="simbok-component-location-unit"
            value="Lokasi"
            required
          >
        </label>

        <label>
          Frekuensi
          <input
            class="simbok-component-frequency"
            type="number"
            min="1"
            step="1"
            value="1"
            required
          >
        </label>

        <label>
          Satuan Frekuensi
          <input
            class="simbok-component-frequency-unit"
            value="Kali"
            required
          >
        </label>

      </div>

      <!-- BARIS 3: Ringkasan Perhitungan -->
      <div class="simbok-component-summary-row">

        <!-- Volume -->
        <div class="simbok-component-total">
          <svg viewBox="0 0 24 24" class="simbok-summary-icon blue">
            <path d="M12 3 2.5 8 12 13 21.5 8 12 3Z"/>
            <path d="m2.5 12 9.5 5 9.5-5"/>
            <path d="m2.5 16 9.5 5 9.5-5"/>
          </svg>
          <div>
            <span>Volume</span>
            <strong data-component-volume-formula></strong>
          </div>
        </div>

        <!-- Total Volume -->
        <div class="simbok-component-total">
          <svg viewBox="0 0 24 24" class="simbok-summary-icon blue">
            <path d="M12 3 2.5 8 12 13 21.5 8 12 3Z"/>
            <path d="m2.5 12 9.5 5 9.5-5"/>
            <path d="m2.5 16 9.5 5 9.5-5"/>
          </svg>
          <div>
            <span>Total Volume</span>
            <strong data-component-volume>1</strong>
          </div>
        </div>

        <!-- Harga Satuan -->
        <div class="simbok-component-total">
          <svg viewBox="0 0 24 24" class="simbok-summary-icon blue">
            <path d="M20 13 11 22 2 13V4h9l9 9Z"/>
            <circle cx="7" cy="9" r="1.5"/>
          </svg>
          <div>
            <span>Harga Satuan</span>
            <strong data-component-price>Rp0</strong>
          </div>
        </div>

        <!-- Satuan Harga -->
        <div class="simbok-component-total is-green">
          <svg viewBox="0 0 24 24" class="simbok-summary-icon green">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M7 7h10M7 11h2m3 0h2m3 0h.01M7 15h2m3 0h2m3 0h.01M7 19h2m3 0h2"/>
          </svg>
          <div>
            <span>Satuan Harga</span>
            <strong data-component-price-unit>-</strong>
          </div>
        </div>

      </div>

      <!-- Input tersembunyi untuk mempertahankan fungsi perhitungan. -->
      <input
        class="simbok-component-price"
        type="hidden"
        value=""
      >

      <input
        class="simbok-component-price-unit"
        type="hidden"
        value=""
      >

    </div>
  `;

  list.appendChild(row);

  const select = row.querySelector(".simbok-component-account");

  const savedKey = data.key ||
    `${data.kodeRekeningBelanja || ""}||${data.jenisBelanja || ""}`;

  if (savedKey !== "||") {
    select.value = savedKey;
  }

  /* Menampilkan rumus volume dengan ikon SVG. */
  const updateVolumeFormula = () => {
    const jumlahOrang =
      row.querySelector(".simbok-component-people").value || 0;

    const satuanOrang =
      row.querySelector(".simbok-component-people-unit").value || "Orang";

    const jumlahLokasi =
      row.querySelector(".simbok-component-location").value || 0;

    const satuanLokasi =
      row.querySelector(".simbok-component-location-unit").value || "Lokasi";

    const frekuensi =
      row.querySelector(".simbok-component-frequency").value || 0;

    const satuanFrekuensi =
      row.querySelector(".simbok-component-frequency-unit").value || "Kali";

    const iconMultiply = `
      <svg
        viewBox="0 0 16 16"
        width="12"
        height="12"
        aria-hidden="true"
        focusable="false"
        style="display:inline-block;vertical-align:middle;margin:0 4px"
      >
        <path
          d="M4 4 L12 12 M12 4 L4 12"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
    `;

    row.querySelector("[data-component-volume-formula]").innerHTML = `
      ${simbokEscape(jumlahOrang)}
      ${simbokEscape(satuanOrang)}
      ${iconMultiply}
      ${simbokEscape(jumlahLokasi)}
      ${simbokEscape(satuanLokasi)}
      ${iconMultiply}
      ${simbokEscape(frekuensi)}
      ${simbokEscape(satuanFrekuensi)}
    `;
  };

  /* Mengisi kode, nama, harga, dan satuan dari Master Rekening Belanja. */
  const fillAccount = () => {
    const account = SIMBOK_REF.rekeningBelanja.find(item =>
      `${item["KODE REKENING BELANJA"]}||${item["JENIS BELANJA"]}` === select.value
    );

    row.querySelector(".simbok-component-code").value =
      account?.["KODE REKENING BELANJA"] || "";

    row.querySelector(".simbok-component-name").value =
      account?.["NAMA REKENING BELANJA"] || "";

    row.querySelector(".simbok-component-price").value =
      data.hargaSatuan ?? account?.["HARGA SATUAN"] ?? "";

    row.querySelector(".simbok-component-price-unit").value =
      data.satuanHarga ?? account?.SATUAN ?? "";

    row.querySelector(".simbok-component-people").value =
      data.jumlahOrang ?? 1;

    row.querySelector(".simbok-component-people-unit").value =
      data.satuanOrang ?? "Orang";

    row.querySelector(".simbok-component-location").value =
      data.jumlahLokasi ?? 1;

    row.querySelector(".simbok-component-location-unit").value =
      data.satuanLokasi ?? "Lokasi";

    row.querySelector(".simbok-component-frequency").value =
      data.frekuensi ?? 1;

    row.querySelector(".simbok-component-frequency-unit").value =
      data.satuanFrekuensi ?? "Kali";

    updateVolumeFormula();
    simbokUpdateComponentTotal(row);
  };

  /* Memperbarui data saat Jenis Belanja berubah. */
  select.addEventListener("change", () => {
    data = {};
    fillAccount();
  });

  if (select.value) {
    fillAccount();
  } else {
    updateVolumeFormula();
  }

  /* Memperbarui rumus volume saat isian berubah. */
  row.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", updateVolumeFormula);
    input.addEventListener("input", simbokUpdateMasterTotal);
  });

  /* Menghapus komponen belanja. */
  row.querySelector(".simbok-plan-remove").addEventListener("click", () => {
    if (list.children.length > 1) {
      row.remove();
      simbokRenumberComponents();
      simbokUpdateMasterTotal();
    } else {
      window.alert("Minimal harus ada satu komponen jenis belanja.");
    }
  });

  simbokRenumberComponents();
  simbokUpdateComponentTotal(row);
}


/* ------------------------------------------------------
   PERHITUNGAN KOMPONEN DAN TOTAL PAGU
------------------------------------------------------ */

/* Menghitung volume, menampilkan rumus SVG, dan menghitung pagu komponen. */
function simbokUpdateComponentTotal(row) {
  const people = simbokNumber(
    row.querySelector(".simbok-component-people").value
  );

  const locations = simbokNumber(
    row.querySelector(".simbok-component-location").value
  );

  const frequency = simbokNumber(
    row.querySelector(".simbok-component-frequency").value
  );

  const price = simbokNumber(
    row.querySelector(".simbok-component-price").value
  );

  const peopleUnit =
    row.querySelector(".simbok-component-people-unit").value || "Orang";

  const locationUnit =
    row.querySelector(".simbok-component-location-unit").value || "Lokasi";

  const frequencyUnit =
    row.querySelector(".simbok-component-frequency-unit").value || "Kali";

  const priceUnit =
    row.querySelector(".simbok-component-price-unit").value || "-";

  const volume = people * locations * frequency;
  const budget = volume * price;

  // Ikon SVG perkalian.
  const multiplyIcon = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style="vertical-align:middle; margin:0 4px; flex-shrink:0;"
    >
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  `;

  // Menampilkan rumus volume menggunakan SVG.
  row.querySelector("[data-component-volume-formula]").innerHTML = `
    ${simbokEscape(people)}
    ${simbokEscape(peopleUnit)}
    ${multiplyIcon}
    ${simbokEscape(locations)}
    ${simbokEscape(locationUnit)}
    ${multiplyIcon}
    ${simbokEscape(frequency)}
    ${simbokEscape(frequencyUnit)}
  `;

  // Menampilkan total volume.
  row.querySelector("[data-component-volume]").textContent =
    new Intl.NumberFormat("id-ID").format(volume);

  // Menampilkan harga satuan.
  row.querySelector("[data-component-price]").textContent =
    simbokCurrency(price);

  // Menampilkan satuan harga.
  row.querySelector("[data-component-price-unit]").textContent =
    priceUnit;

  return { volume, budget };
}

/* Mengatur nomor urut kartu komponen. */
function simbokRenumberComponents() {
  document.querySelectorAll("#simbokKomponenList .simbok-component-card").forEach((row, index) => {
    row.querySelector(".simbok-component-index").textContent =
      `KOMPONEN ${String(index + 1).padStart(2, "0")}`;
  });
}

/* Membaca seluruh data komponen dari form. */
function simbokReadKomponen() {
  return Array.from(document.querySelectorAll("#simbokKomponenList .simbok-component-card")).map(row => {
    const account = SIMBOK_REF.rekeningBelanja.find(item =>
      `${item["KODE REKENING BELANJA"]}||${item["JENIS BELANJA"]}` ===
      row.querySelector(".simbok-component-account").value
    );
    const calculation = simbokUpdateComponentTotal(row);

    return {
      key: row.dataset.componentKey,
      kodeRekeningBelanja: account?.["KODE REKENING BELANJA"] || "",
      namaRekeningBelanja: account?.["NAMA REKENING BELANJA"] || "",
      jenisBelanja: account?.["JENIS BELANJA"] || "",
      hargaSatuan: simbokNumber(row.querySelector(".simbok-component-price").value),
      satuanHarga: row.querySelector(".simbok-component-price-unit").value,
      jumlahOrang: simbokNumber(row.querySelector(".simbok-component-people").value),
      satuanOrang: row.querySelector(".simbok-component-people-unit").value.trim(),
      jumlahLokasi: simbokNumber(row.querySelector(".simbok-component-location").value),
      satuanLokasi: row.querySelector(".simbok-component-location-unit").value.trim(),
      frekuensi: simbokNumber(row.querySelector(".simbok-component-frequency").value),
      satuanFrekuensi: row.querySelector(".simbok-component-frequency-unit").value.trim(),
      totalVolume: calculation.volume,
      totalPagu: calculation.budget
    };
  });
}

/* Menjumlahkan pagu seluruh komponen menjadi total Detail Menu. */
function simbokUpdateMasterTotal() {
  let total = 0;
  document.querySelectorAll("#simbokKomponenList .simbok-component-card").forEach(row => {
    total += simbokUpdateComponentTotal(row).budget;
  });
  document.getElementById("simbokMasterTotal").textContent = simbokCurrency(total);
}

/* Mengambil total pagu dari seluruh komponen master. */
function simbokGetMasterTotal(master) {
  return master.komponenBelanja.reduce((sum, item) => sum + item.totalPagu, 0);
}


/* ------------------------------------------------------
   TAMPILAN DAFTAR DETAIL MENU
------------------------------------------------------ */

/* Menampilkan daftar Detail Menu dalam bentuk kartu. */
function simbokRenderMasters() {
  const wrap = document.getElementById("simbokMasterTableWrap");
  const count = document.getElementById("simbokMasterCount");
  const year = Number(document.getElementById("simbokPlanYearMaster")?.value || 2027);
  const search = document.getElementById("simbokMasterSearch")?.value.trim().toLowerCase() || "";
  const menuFilter = document.getElementById("simbokMasterMenuFilter")?.value || "";
  if (!wrap || !count) return;

  const addButton = document.getElementById("simbokOpenMasterModal");
  if (addButton) addButton.hidden = !simbokIsSuperAdmin();

  const yearMasters = simbokMasters.filter(master =>
    Number(master.tahunAnggaran) === year
  );

  const filtered = yearMasters.filter(master => {
    // Pencarian mencakup identitas detail menu dan seluruh jenis belanja.
    const searchable = [
      master.kodeRincianMenu,
      master.namaMenu,
      master.namaRincianMenu,
      master.namaPemegangProgram,
      master.nipPemegangProgram,
      ...(master.komponenBelanja || []).map(component => component.jenisBelanja)
    ].join(" ").toLowerCase();

    return searchable.includes(search) &&
      (!menuFilter || master.kodeMenu === menuFilter);
  });

  count.textContent = `${yearMasters.length} detail menu`;

  const monthlySelect = document.getElementById("simbokPlanMenuSelect");
  if (monthlySelect) {
    const previousValue = monthlySelect.value;
    monthlySelect.innerHTML = '<option value="">Pilih detail menu</option>';

    yearMasters.forEach(master => {
      const option = document.createElement("option");
      option.value = master.id;
      option.textContent = `${master.kodeRincianMenu} — ${master.namaRincianMenu}`;
      monthlySelect.appendChild(option);
    });

    if (Array.from(monthlySelect.options).some(option => option.value === previousValue)) {
      monthlySelect.value = previousValue;
    }
  }

  if (!filtered.length) {
    wrap.innerHTML = `
      <div class="simbok-plan-empty simbok-master-empty">
        <span class="simbok-master-empty-icon">⌕</span>
        <strong>${yearMasters.length ? "Data tidak ditemukan" : "Belum ada Dokumen Master BOK"}</strong>
        <p>${yearMasters.length
          ? "Coba ubah kata pencarian atau filter menu."
          : `Belum ada detail menu untuk Tahun Anggaran ${year}.`}</p>
      </div>
    `;
  } else {
    const canManage = simbokIsSuperAdmin();

    wrap.innerHTML = filtered.map(master => {
      const componentChips = master.komponenBelanja.map(component => `
        <span class="simbok-master-component-chip">
          ${simbokEscape(component.jenisBelanja)}
        </span>
      `).join("");

      const actions = canManage ? `
        <div class="simbok-master-card-actions">
          <button type="button" data-master-edit="${master.id}" title="Edit" aria-label="Edit">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16z"/>
            </svg>
          </button>
          <button type="button" data-master-duplicate="${master.id}" title="Duplikasi" aria-label="Duplikasi">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="8" y="8" width="12" height="12" rx="2"/>
              <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
          <button type="button" class="is-danger" data-master-delete="${master.id}" title="Hapus" aria-label="Hapus">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3"/>
            </svg>
          </button>
        </div>
      ` : "";

      return `
        <article class="simbok-master-card">
          <div class="simbok-master-card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m12 3 9 4.5-9 4.5-9-4.5z"/>
              <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>
            </svg>
          </div>

          <div class="simbok-master-card-code">
            <span>${simbokEscape(master.kodeRincianMenu)}</span>
            <small>TA ${simbokEscape(master.tahunAnggaran)}</small>
          </div>

          <div class="simbok-master-card-main">
            <h4>${simbokEscape(master.namaMenu)}</h4>
            <p>${simbokEscape(master.namaRincianMenu)}</p>

            <div class="simbok-master-card-meta">
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.5"/>
                  <path d="M5 21a7 7 0 0 1 14 0"/>
                </svg>
                ${simbokEscape(master.namaPemegangProgram)}
              </span>
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m12 3 9 4.5-9 4.5-9-4.5z"/>
                  <path d="m3 12 9 4.5 9-4.5"/>
                </svg>
                ${master.komponenBelanja.length} Komponen
              </span>
            </div>

            <div class="simbok-master-card-components">
              ${componentChips}
            </div>
          </div>

          <div class="simbok-master-card-budget">
            <small>Total Pagu</small>
            <strong>${simbokCurrency(master.totalPagu)}</strong>
          </div>

          ${actions}
        </article>
      `;
    }).join("");
  }

  simbokRenderMonthlyWorkspace();
  simbokRenderBudgetRecap();
  simbokUpdateSummary();
}


/* ------------------------------------------------------
   TAMBAH, EDIT, DAN DUPLIKASI DETAIL MENU
------------------------------------------------------ */

/* Membuka kembali modal untuk mengedit Detail Menu. */
function simbokEditMaster(id) {
  if (!simbokIsSuperAdmin()) return;
  simbokOpenMasterModal(id);
}

/* Menggandakan Detail Menu menjadi draft baru. */
function simbokDuplicateMaster(id) {
  if (!simbokIsSuperAdmin()) return;

  const source = simbokMasters.find(master => master.id === id);
  if (!source) return;

  simbokOpenMasterModal(id);
  simbokEditingId = null;

  document.getElementById("simbokMasterTahun").value =
    Number(document.getElementById("simbokPlanYearMaster").value || 2027);
  document.getElementById("simbokMasterModalTitle").textContent =
    "Duplikasi Detail Menu / Kegiatan";
  document.getElementById("simbokSaveMaster").textContent =
    "Simpan Salinan";
}


/* ------------------------------------------------------
   SIMPAN DETAIL MENU
------------------------------------------------------ */

/* Memvalidasi dan menyimpan Detail Menu ke memori halaman. */
function simbokSaveMaster(event) {
  event.preventDefault();
  if (!simbokIsSuperAdmin()) return;

  const year = Number(document.getElementById("simbokMasterTahun").value);
  const menuCode = document.getElementById("simbokMasterMenu").value;
  const detailCode = document.getElementById("simbokMasterRincian").value;
  const detail = SIMBOK_REF.rincian.find(
    item => item["KODE RINCIAN MENU"] === detailCode
  );
  const components = simbokReadKomponen();

  if (!Number.isInteger(year) || year < 2027 || year > 2100) {
    window.alert("Tahun Anggaran dimulai dari 2027.");
    return;
  }

  if (!detail || !menuCode) {
    window.alert("Pilih Menu dan Rincian Menu terlebih dahulu.");
    return;
  }

  if (
    !document.getElementById("simbokMasterNip").value.trim() ||
    !document.getElementById("simbokMasterPemegang").value.trim()
  ) {
    window.alert("Lengkapi NIP/NRP dan Nama Pemegang Program.");
    return;
  }

  if (!components.length || components.some(item =>
    !item.key ||
    !item.kodeRekeningBelanja ||
    item.hargaSatuan <= 0 ||
    item.jumlahOrang <= 0 ||
    item.jumlahLokasi <= 0 ||
    item.frekuensi <= 0 ||
    !item.satuanHarga ||
    !item.satuanOrang ||
    !item.satuanLokasi ||
    !item.satuanFrekuensi
  )) {
    window.alert("Lengkapi seluruh field pada setiap komponen jenis belanja.");
    return;
  }

  const duplicate = simbokMasters.some(master =>
    master.tahunAnggaran === year &&
    master.kodeRincianMenu === detailCode &&
    master.id !== simbokEditingId
  );

  if (duplicate) {
    window.alert("Rincian Menu tersebut sudah terdaftar pada Tahun Anggaran ini.");
    return;
  }

  const master = {
    id: simbokEditingId ?? simbokNextId++,
    tahunAnggaran: year,
    kodeMenu: menuCode,
    namaMenu: SIMBOK_REF.menu.find(item => item["KODE MENU"] === menuCode)?.MENU || "",
    kodeRincianMenu: detailCode,
    kode: detailCode,
    namaRincianMenu: detail["RINCIAN MENU"],
    definisiOperasional: detail["DEFINISI OPERASIONAL"] || "",
    kodeRekeningKegiatan: detail["KODE REKENING KEGIATAN"] || "",
    namaRekeningKegiatan: detail["NAMA REKENING KEGIATAN"] || "",
    nipPemegangProgram: document.getElementById("simbokMasterNip").value.trim(),
    namaPemegangProgram: document.getElementById("simbokMasterPemegang").value.trim(),
    komponenBelanja: components,
    totalPagu: components.reduce((sum, item) => sum + item.totalPagu, 0)
  };

  if (simbokEditingId !== null) {
    const index = simbokMasters.findIndex(item => item.id === simbokEditingId);
    if (index >= 0) simbokMasters[index] = master;
  } else {
    simbokMasters.push(master);
  }

  document.getElementById("simbokPlanYearMaster").value = year;
  document.getElementById("simbokPlanYearMonthly").value = year;
  document.getElementById("simbokPlanYearRecap").value = year;

  simbokCloseMasterModal();
  simbokRenderMasters();
}


/* ------------------------------------------------------
   HAPUS DETAIL MENU
------------------------------------------------------ */

/* Menghapus Detail Menu beserta rencana bulanannya. */
function simbokDeleteMaster(id) {
  if (!simbokIsSuperAdmin()) return;
  const master = simbokMasters.find(item => item.id === id);
  if (!master || !window.confirm(`Hapus detail menu "${master.namaRincianMenu}"?`)) return;

  simbokMasters = simbokMasters.filter(item => item.id !== id);
  Object.keys(simbokMonthlyPlans).forEach(key => {
    if (key.startsWith(`${id}-`)) delete simbokMonthlyPlans[key];
  });
  simbokRenderMasters();
}


/* ------------------------------------------------------
   FILTER DAN TAHUN ANGGARAN DETAIL MENU
------------------------------------------------------ */

/* Mengisi pilihan Tahun Anggaran pada filter master. */
function simbokPopulateMasterYearFilter() {
  const select = document.getElementById("simbokPlanYearMaster");
  if (!select) return;

  const currentYear = new Date().getFullYear();
  const firstYear = 2027;
  const defaultYear = Math.max(firstYear, currentYear);
  const lastYear = Math.max(defaultYear + 5, 2032);
  const selectedYear = Number(select.value) || defaultYear;

  select.innerHTML = "";

  for (let year = firstYear; year <= lastYear; year += 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    select.appendChild(option);
  }

  select.value = String(
    selectedYear >= firstYear && selectedYear <= lastYear
      ? selectedYear
      : defaultYear
  );
}


/* ======================================================
   SIMBOK — TAB 2: RENCANA BULANAN
====================================================== */

/* ------------------------------------------------------
   IDENTITAS DAN KUNCI RENCANA BULANAN
------------------------------------------------------ */

/* Membuat kunci unik berdasarkan master, tahun, dan bulan. */
function simbokPlanKey(masterId, year, month) {
  return `${masterId}-${year}-${month}`;
}


/* ------------------------------------------------------
   TAMPILAN WORKSPACE RENCANA BULANAN
------------------------------------------------------ */

/* Menampilkan pagu dan rencana bulanan setiap komponen. */
function simbokRenderMonthlyWorkspace() {
  const wrap = document.getElementById("simbokMonthlyWorkspace");
  const save = document.getElementById("simbokSaveMonthly");
  const masterId = Number(document.getElementById("simbokPlanMenuSelect")?.value);
  const month = Number(document.getElementById("simbokPlanMonth")?.value || 1);
  const year = Number(document.getElementById("simbokPlanYearMonthly")?.value || 2027);
  const master = simbokMasters.find(item =>
    item.id === masterId && Number(item.tahunAnggaran) === year
  );

  if (!wrap || !save) return;

  if (!master) {
    wrap.innerHTML = '<div class="simbok-plan-empty">Pilih detail menu untuk menampilkan komponen jenis belanja.</div>';
    save.disabled = true;
    document.getElementById("simbokPlanMonthTotal").textContent = simbokCurrency(0);
    simbokUpdateSummary();
    return;
  }

  const allocations = simbokMonthlyPlans[simbokPlanKey(master.id, year, month)] || {};

  const rows = master.komponenBelanja.map(component => {
    const planned = Number(allocations[component.key] || 0);
    const otherMonths = Object.entries(simbokMonthlyPlans).reduce((sum, [key, values]) => {
      const [storedMasterId, storedYear, storedMonth] = key.split("-").map(Number);
      if (storedMasterId === master.id && storedYear === year && storedMonth !== month) {
        return sum + Number(values[component.key] || 0);
      }
      return sum;
    }, 0);

    const available = Math.max(0, component.totalPagu - otherMonths);

    return `
      <tr>
        <td>
          <strong>${simbokEscape(component.jenisBelanja)}</strong>
          <small class="simbok-table-subtext">${simbokEscape(component.kodeRekeningBelanja)}</small>
        </td>
        <td>${simbokEscape(component.totalVolume)} ${simbokEscape(component.satuanHarga)}</td>
        <td class="simbok-plan-number">${simbokCurrency(component.totalPagu)}</td>
        <td>
          <input
            class="simbok-plan-inline-input"
            type="number"
            min="0"
            max="${available}"
            step="1"
            value="${planned}"
            data-monthly-index="${simbokEscape(component.key)}"
          >
        </td>
        <td class="simbok-plan-number" data-monthly-remaining="${simbokEscape(component.key)}">
          ${simbokCurrency(available - planned)}
        </td>
      </tr>
    `;
  }).join("");

  wrap.innerHTML = `
    <table class="simbok-plan-table">
      <thead>
        <tr>
          <th>Jenis Belanja</th>
          <th>Total Volume</th>
          <th class="simbok-plan-number">Pagu Komponen</th>
          <th>Rencana Bulan Ini (Rp)</th>
          <th class="simbok-plan-number">Sisa Tersedia</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  wrap.querySelectorAll("[data-monthly-index]").forEach(input => {
    input.addEventListener("input", simbokUpdateMonthlyTotal);
  });

  save.disabled = false;
  simbokUpdateMonthlyTotal();
}


/* ------------------------------------------------------
   PERHITUNGAN ALOKASI BULANAN
------------------------------------------------------ */

/* Menghitung total rencana dan sisa pagu bulan terpilih. */
function simbokUpdateMonthlyTotal() {
  const masterId = Number(document.getElementById("simbokPlanMenuSelect")?.value);
  const month = Number(document.getElementById("simbokPlanMonth")?.value || 1);
  const year = Number(document.getElementById("simbokPlanYearMonthly")?.value || 2027);
  const master = simbokMasters.find(item =>
    item.id === masterId && Number(item.tahunAnggaran) === year
  );
  const wrap = document.getElementById("simbokMonthlyWorkspace");

  if (!master || !wrap) return;

  let total = 0;

  wrap.querySelectorAll("[data-monthly-index]").forEach(input => {
    const componentKey = input.dataset.monthlyIndex;
    const component = master.komponenBelanja.find(item => item.key === componentKey);
    if (!component) return;

    const otherMonths = Object.entries(simbokMonthlyPlans).reduce((sum, [planKey, values]) => {
      const [storedMasterId, storedYear, storedMonth] = planKey.split("-").map(Number);
      if (
        storedMasterId === master.id &&
        storedYear === year &&
        storedMonth !== month
      ) {
        return sum + Number(values[componentKey] || 0);
      }
      return sum;
    }, 0);

    const available = Math.max(0, component.totalPagu - otherMonths);
    let value = simbokNumber(input.value);

    if (value > available) {
      value = available;
      input.value = String(available);
    }

    total += value;

    const remaining = wrap.querySelector(
      `[data-monthly-remaining="${componentKey}"]`
    );

    if (remaining) {
      remaining.textContent = simbokCurrency(available - value);
    }
  });

  document.getElementById("simbokPlanMonthTotal").textContent = simbokCurrency(total);
  simbokUpdateSummary();
}


/* ------------------------------------------------------
   SIMPAN RENCANA BULANAN
------------------------------------------------------ */

/* Menyimpan alokasi setiap komponen pada bulan terpilih. */
function simbokSaveMonthlyPlan() {
  const masterId = Number(document.getElementById("simbokPlanMenuSelect").value);
  const month = Number(document.getElementById("simbokPlanMonth").value);
  const year = Number(document.getElementById("simbokPlanYearMonthly").value || 2027);
  const master = simbokMasters.find(item =>
    item.id === masterId && Number(item.tahunAnggaran) === year
  );

  if (!master) return;

  const allocations = {};

  document.querySelectorAll("#simbokMonthlyWorkspace [data-monthly-index]")
    .forEach(input => {
      allocations[input.dataset.monthlyIndex] = simbokNumber(input.value);
    });

  simbokMonthlyPlans[simbokPlanKey(masterId, year, month)] = allocations;

  simbokRenderMonthlyWorkspace();
  simbokRenderBudgetRecap();
  simbokUpdateSummary();

  window.alert(
    "Rencana bulan ini tersimpan sementara pada sesi halaman ini. Penyimpanan permanen belum diaktifkan."
  );
}


/* ======================================================
   SIMBOK — TAB 3: REKAP PAGU DAN RENCANA
====================================================== */

/* ------------------------------------------------------
   TAMPILAN REKAP ANGGARAN
------------------------------------------------------ */

/* Menampilkan rekap pagu, rencana, sisa, dan persentase. */
function simbokRenderBudgetRecap() {
  const wrap = document.getElementById("simbokBudgetRecap");
  const year = Number(document.getElementById("simbokPlanYearRecap")?.value || 2027);
  const masters = simbokMasters.filter(master =>
    Number(master.tahunAnggaran) === year
  );

  if (!wrap) return;

  if (!masters.length) {
    wrap.innerHTML = `
      <div class="simbok-plan-empty">
        Belum ada data untuk direkap pada Tahun Anggaran ${year}.
      </div>
    `;
    simbokUpdateSummary();
    return;
  }

  const rows = [];

  masters.forEach(master => {
    master.komponenBelanja.forEach(component => {
      let planned = 0;

      Object.entries(simbokMonthlyPlans).forEach(([key, allocation]) => {
        const [masterId, storedYear] = key.split("-").map(Number);

        if (masterId === master.id && storedYear === year) {
          planned += Number(allocation[component.key] || 0);
        }
      });

      const remaining = component.totalPagu - planned;
      const percent = component.totalPagu > 0
        ? Math.min(100, planned / component.totalPagu * 100)
        : 0;

      rows.push(`
        <tr>
          <td>
            <strong>${simbokEscape(master.kodeRincianMenu)}</strong>
            <small class="simbok-table-subtext">${simbokEscape(master.namaRincianMenu)}</small>
          </td>
          <td>${simbokEscape(component.jenisBelanja)}</td>
          <td class="simbok-plan-number">${simbokCurrency(component.totalPagu)}</td>
          <td class="simbok-plan-number">${simbokCurrency(planned)}</td>
          <td class="simbok-plan-number">${simbokCurrency(remaining)}</td>
          <td>
            <div class="simbok-plan-progress">
              <span style="width:${percent}%"></span>
            </div>
            <small class="simbok-table-subtext">${percent.toFixed(1)}%</small>
          </td>
        </tr>
      `);
    });
  });

  wrap.innerHTML = `
    <table class="simbok-plan-table">
      <thead>
        <tr>
          <th>Detail Menu</th>
          <th>Jenis Belanja</th>
          <th class="simbok-plan-number">Pagu</th>
          <th class="simbok-plan-number">Rencana</th>
          <th class="simbok-plan-number">Sisa</th>
          <th>Progres</th>
        </tr>
      </thead>
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}


/* ======================================================
   SIMBOK — RINGKASAN DAN STATISTIK
====================================================== */

/* Memperbarui seluruh kartu ringkasan berdasarkan tahun terpilih. */
function simbokUpdateSummary() {
  const masterYear = Number(
    document.getElementById("simbokPlanYearMaster")?.value || 2027
  );
  const monthlyYear = Number(
    document.getElementById("simbokPlanYearMonthly")?.value || 2027
  );
  const recapYear = Number(
    document.getElementById("simbokPlanYearRecap")?.value || 2027
  );

  const masterList = simbokMasters.filter(master =>
    Number(master.tahunAnggaran) === masterYear
  );
  const monthlyList = simbokMasters.filter(master =>
    Number(master.tahunAnggaran) === monthlyYear
  );
  const recapList = simbokMasters.filter(master =>
    Number(master.tahunAnggaran) === recapYear
  );

  const sumPagu = list => list.reduce(
    (sum, master) => sum + Number(master.totalPagu || 0),
    0
  );

  const masterPagu = sumPagu(masterList);
  const monthlyPagu = sumPagu(monthlyList);
  const recapPagu = sumPagu(recapList);

  const masterComponents = masterList.reduce(
    (sum, master) => sum + master.komponenBelanja.length,
    0
  );

  let totalYearPlan = 0;
  let selectedMonthPlan = 0;
  const selectedMonth = Number(
    document.getElementById("simbokPlanMonth")?.value || 1
  );

  Object.entries(simbokMonthlyPlans).forEach(([key, allocation]) => {
    const [masterId, year, month] = key.split("-").map(Number);
    const total = Object.values(allocation).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );

    if (year === monthlyYear) {
      totalYearPlan += total;
      if (month === selectedMonth) {
        selectedMonthPlan += total;
      }
    }
  });

  let recapPlan = 0;
  Object.entries(simbokMonthlyPlans).forEach(([key, allocation]) => {
    const [, year] = key.split("-").map(Number);

    if (year === recapYear) {
      recapPlan += Object.values(allocation).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      );
    }
  });

  const recapRemaining = recapPagu - recapPlan;
  const recapPercent = recapPagu > 0 ? recapPlan / recapPagu * 100 : 0;

  document.getElementById("simbokMasterSummaryPagu").textContent =
    simbokCurrency(masterPagu);
  // Hitung Menu dan Rincian Menu unik agar satu menu yang memiliki
  // banyak detail tidak dihitung berulang pada ringkasan.
  const uniqueMenuCount = new Set(
    masterList
      .map(master => String(master.namaMenu || "").trim())
      .filter(Boolean)
  ).size;

  const uniqueRincianCount = new Set(
    masterList
      .map(master => String(master.namaRincianMenu || "").trim())
      .filter(Boolean)
  ).size;

  document.getElementById("simbokMasterSummaryMenuRincian").textContent =
    `${uniqueMenuCount}/${uniqueRincianCount}`;

  document.getElementById("simbokMasterSummaryCount").textContent =
    new Intl.NumberFormat("id-ID").format(masterList.length);

  document.getElementById("simbokMasterSummaryComponents").textContent =
    new Intl.NumberFormat("id-ID").format(masterComponents);

  document.getElementById("simbokMonthlySummaryPagu").textContent =
    simbokCurrency(monthlyPagu);
  document.getElementById("simbokMonthlySummaryPlan").textContent =
    simbokCurrency(selectedMonthPlan);
  document.getElementById("simbokMonthlySummaryRemaining").textContent =
    simbokCurrency(monthlyPagu - totalYearPlan);

  document.getElementById("simbokRecapSummaryPagu").textContent =
    simbokCurrency(recapPagu);
  document.getElementById("simbokRecapSummaryPlanned").textContent =
    simbokCurrency(recapPlan);
  document.getElementById("simbokRecapSummaryRemaining").textContent =
    simbokCurrency(recapRemaining);
  document.getElementById("simbokRecapSummaryPercent").textContent =
    `${recapPercent.toFixed(1)}%`;
  document.getElementById("simbokRecapYearLabel").textContent =
    `Tahun Anggaran ${recapYear}`;
}


/* ======================================================
   SIMBOK — INISIALISASI DAN PENGELOLAAN HALAMAN
====================================================== */

/* Menginisialisasi modul perencanaan dan event halaman. */
function simbokInitPlanning() {
  const form = document.getElementById("simbokMasterForm");
  if (!form || form.dataset.initialized === "true") return;

  form.dataset.initialized = "true";

  /* Tombol tambah hanya ditampilkan kepada SUPERADMIN. */
  const openButton = document.getElementById("simbokOpenMasterModal");
  if (openButton) {
    openButton.hidden = !simbokIsSuperAdmin();
    simbokAddHandler(openButton, "click", () => simbokOpenMasterModal());
  }

  /* Kontrol buka/tutup modal. */
  simbokAddHandler(
    document.getElementById("simbokCloseMasterModal"),
    "click",
    simbokCloseMasterModal
  );
  simbokAddHandler(
    document.getElementById("simbokCancelMasterModal"),
    "click",
    simbokCloseMasterModal
  );
  simbokAddHandler(document.getElementById("simbokMasterModal"), "click", event => {
    if (event.target.id === "simbokMasterModal") {
      simbokCloseMasterModal();
    }
  });
  simbokAddHandler(document, "keydown", event => {
    const modal = document.getElementById("simbokMasterModal");
    if (event.key === "Escape" && modal && !modal.hidden) {
      simbokCloseMasterModal();
    }
  });

  /* Siapkan pilihan tahun dinamis sebelum data master dirender. */
  simbokPopulateMasterYearFilter();

  /* Isi master referensi dan ikat dropdown Menu/Rincian Menu. */
  simbokPopulateReferences();

  /* Event perubahan pilihan Pemegang Program. */
  simbokAddHandler(
    document.getElementById("simbokMasterPemegang"),
    "change",
    simbokUpdatePegawaiTerpilih
  );

  simbokAddHandler(
    document.getElementById("simbokMasterMenu"),
    "change",
    () => simbokPopulateRincianOptions()
  );
  simbokAddHandler(
    document.getElementById("simbokMasterRincian"),
    "change",
    simbokUpdateRincianSnapshot
  );
  simbokAddHandler(
    document.getElementById("simbokAddKomponen"),
    "click",
    () => {
      if (simbokIsSuperAdmin()) simbokAddKomponenRow();
    }
  );
  simbokAddHandler(form, "submit", simbokSaveMaster);

  /* Event aksi kartu dikelola dengan delegation agar listener tidak menumpuk. */
  simbokAddHandler(document.getElementById("simbokMasterTableWrap"), "click", event => {
    const edit = event.target.closest("[data-master-edit]");
    const duplicate = event.target.closest("[data-master-duplicate]");
    const remove = event.target.closest("[data-master-delete]");

    if (edit) simbokEditMaster(Number(edit.dataset.masterEdit));
    if (duplicate) simbokDuplicateMaster(Number(duplicate.dataset.masterDuplicate));
    if (remove) simbokDeleteMaster(Number(remove.dataset.masterDelete));
  });

  /* Pencarian dan filter daftar Dokumen Master BOK. */
  simbokAddHandler(
    document.getElementById("simbokMasterSearch"),
    "input",
    simbokRenderMasters
  );
  simbokAddHandler(
    document.getElementById("simbokMasterMenuFilter"),
    "change",
    simbokRenderMasters
  );
  // Refresh hanya menggambar ulang daftar sesuai filter yang sedang dipilih.
  simbokAddHandler(
    document.getElementById("simbokMasterResetFilter"),
    "click",
    simbokRenderMasters
  );

  /* Sinkronisasi tahun untuk ketiga subtab; data tetap terpisah per tahun. */
  [
    "simbokPlanYearMaster",
    "simbokPlanYearMonthly",
    "simbokPlanYearRecap"
  ].forEach(id => {
    simbokAddHandler(document.getElementById(id), "change", event => {
      let year = Number(event.target.value);
      if (!Number.isInteger(year) || year < 2027) year = 2027;
      if (year > 2100) year = 2100;

      [
        "simbokPlanYearMaster",
        "simbokPlanYearMonthly",
        "simbokPlanYearRecap"
      ].forEach(otherId => {
        document.getElementById(otherId).value = year;
      });

      simbokRenderMasters();
    });
  });

  /* Navigasi internal Master, Rencana Bulanan, dan Rekap Pagu. */
  const planTabs = Array.from(document.querySelectorAll("[data-plan-tab]"));
  const planViews = Array.from(document.querySelectorAll("[data-plan-view]"));

  planTabs.forEach(tab => {
    simbokAddHandler(tab, "click", () => {
      simbokActivatePlanTab(tab, planTabs, planViews);
    });
  });

  /* Kontrol rencana bulanan. */
  simbokAddHandler(
    document.getElementById("simbokPlanMenuSelect"),
    "change",
    simbokRenderMonthlyWorkspace
  );
  simbokAddHandler(
    document.getElementById("simbokPlanMonth"),
    "change",
    () => {
      simbokRenderMonthlyWorkspace();
      simbokUpdateSummary();
    }
  );
  simbokAddHandler(
    document.getElementById("simbokSaveMonthly"),
    "click",
    simbokSaveMonthlyPlan
  );

  simbokRenderMasters();
}

/* Memuat halaman utama modul simBOK. */
export async function smartofficeLoadPage() {
  smartofficeDestroyPage();

  const pageLogo = document.getElementById("simbokPageLogo");
  if (pageLogo) pageLogo.src = logoSimbok;

  const tabs = Array.from(document.querySelectorAll(".smartoffice-tab-wrapper [data-simbok-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-simbok-panel]"));
  if (!tabs.length) return;

  tabs.forEach((tab, index) => {
    simbokAddHandler(tab, "click", () => simbokActivateTab(tab, tabs, panels));
    simbokAddHandler(tab, "keydown", event => {
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      simbokActivateTab(tabs[nextIndex], tabs, panels, true);
    });
  });

  const initialTab = tabs.find(tab => tab.classList.contains("active")) || tabs[0];
  simbokActivateTab(initialTab, tabs, panels);

  try {
    await simbokLoadReferences();
    simbokInitPlanning();
  } catch (error) {
    console.error("[simBOK] Gagal memuat master Firestore:", error);
    window.alert("Data master simBOK gagal dimuat dari Firestore. Periksa koneksi dan izin akses.");
  }
}

/* Membersihkan event listener dan state saat meninggalkan halaman. */
export function smartofficeDestroyPage() {
  simbokHandlers.forEach(([element, eventName, handler]) => {
    element.removeEventListener(eventName, handler);
  });

  simbokHandlers = [];

  const form = document.getElementById("simbokMasterForm");
  if (form) delete form.dataset.initialized;

  document.body.classList.remove("simbok-modal-open");
}




































