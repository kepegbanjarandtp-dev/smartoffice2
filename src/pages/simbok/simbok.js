/* ======================================================
   SIMBOK — IMPORT MODULE
====================================================== */
import { smartofficeGetSession } from "../../core/session.js";
import logoSimbok from "../../assets/icons/logo-simbok.svg";
import { smartofficeFirestore } from "../../core/firebase-firestore.js";
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";


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

/* RPD */
let simbokRPDData = [];
let simbokRPDLoaded = false;

let simbokRpdEditingMaster = null;
let simbokRpdLastFocus = null;

let simbokRpdDraftComponents = [];


/* ======================================================
   SIMBOK — CACHE MASTER FIRESTORE
====================================================== */

/* Menampung seluruh data referensi simBOK. */
const SIMBOK_REF = {
  menu: [],
  rincian: [],
  detailMenu: [],
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

  try {
    const snapshot = await getDocs(
      collection(smartofficeFirestore, collectionName)
    );

    console.log(
      `[simBOK] FIRESTORE SUCCESS: ${collectionName} (${snapshot.size} dokumen)`
    );

    return snapshot.docs.map(document => ({
      id: document.id,
      ...document.data()
    }));

  } catch (error) {
    console.error(
      `[simBOK] FIRESTORE ERROR pada collection: ${collectionName}`,
      {
        code: error.code,
        message: error.message,
        error
      }
    );

    throw error;
  }
}

/* Collection transaksi Master Kegiatan BOK. */
const SIMBOK_COLLECTION_MASTER = "simbok_master_kegiatan_bok";

/* Memuat Master Kegiatan BOK dari Firestore. */
async function simbokLoadMasters() {
  const records = await simbokGetMasterCollection(
    SIMBOK_COLLECTION_MASTER
  );

  simbokMasters = records.map((item, index) => ({
    ...item,

    // ID internal numerik dipertahankan sementara
    // agar fungsi tampilan lama tidak rusak.
    id: index + 1,

    // ID dokumen asli Firestore untuk update dan delete.
    firestoreId: item.id,

    tahunAnggaran: Number(item.tahunAnggaran),
    komponenBelanja: Array.isArray(item.komponenBelanja)
      ? item.komponenBelanja
      : [],
    totalPagu: Number(item.totalPagu || 0)
  }));

  simbokNextId = simbokMasters.length + 1;
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
      detailMenu,
      rekeningKegiatan,
      rekeningBelanja,
      satuan
    ] = await Promise.all([
      simbokGetMasterCollection("simbok_master_menu"),
      simbokGetMasterCollection("simbok_master_rincian_menu"),
      simbokGetMasterCollection("simbok_master_detail_menu"),
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

    SIMBOK_REF.detailMenu = detailMenu.map(item => ({
      ...item,
      kodeDetailMenu: item.kodeDetailMenu ?? item.id ?? "",
      kodeMenu: item.kodeMenu ?? "",
      namaMenu: item.namaMenu ?? "",
      kodeRincianMenu: item.kodeRincianMenu ?? "",
      namaRincianMenu: item.namaRincianMenu ?? "",
      definisiOperasional: item.definisiOperasional ?? "",
      kodeRekeningKegiatan: item.kodeRekeningKegiatan ?? "",
      namaRekeningKegiatan: item.namaRekeningKegiatan ?? "",
      status: item.status ?? ""
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

function simbokGetSessionUser() {
  return smartofficeGetSession() || {};
}

function simbokGetSessionNip() {
  const session = simbokGetSessionUser();
  return String(session.nip || "").trim();
}

function simbokCanManageRPD(master) {
  const session = simbokGetSessionUser();

  // Super Admin dapat mengelola seluruh RPD.
  if (simbokIsSuperAdmin()) {
    return true;
  }

  // Pemegang Program hanya dapat mengelola Detail Menu miliknya.
  const sessionNip = String(session.nip || "").trim();
  const pemegangNip = String(master?.nipPemegangProgram || "").trim();

  return Boolean(sessionNip && pemegangNip && sessionNip === pemegangNip);
}


/* ======================================================
   SIMBOK — MASTER REFERENSI
====================================================== */

/* Mengisi dropdown Menu, filter Menu, dan Detail Menu. */
function simbokPopulateReferences() {
  const menu = document.getElementById("simbokMasterMenu");
  const filter = document.getElementById("simbokMasterMenuFilter");
  const rpdFilter = document.getElementById("simbokRpdMenuFilter");

  if (menu || filter || rpdFilter) {
    SIMBOK_REF.menu
      .filter(item => String(item.STATUS).toUpperCase() === "AKTIF")
      .forEach(item => {
        const option = document.createElement("option");
        option.value = item["KODE MENU"];
        option.textContent = `${item["KODE MENU"]} — ${item.MENU}`;

        if (menu) menu.appendChild(option.cloneNode(true));
        if (filter) filter.appendChild(option.cloneNode(true));
        if (rpdFilter) rpdFilter.appendChild(option.cloneNode(true));
      });
  }

  // Mengisi dropdown Nama Detail Menu.
  simbokPopulateDetailMenuOptions();
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

/* Mengisi dropdown Nama Detail Menu dari Firestore. */
function simbokPopulateDetailMenuOptions() {
  const select = document.getElementById("simbokMasterDetailMenu");
  if (!select) return;

  select.innerHTML = '<option value="">Pilih detail menu</option>';

  SIMBOK_REF.detailMenu
    .filter(item => String(item.status).trim().toUpperCase() === "AKTIF")
    .forEach(item => {
      const option = document.createElement("option");

      option.value = item.kodeDetailMenu;
      option.textContent = item.namaDetailMenu;

      select.appendChild(option);
    });

  simbokInitDetailMenuCustomSelect();
}

/* Menginisialisasi custom dropdown Detail Menu. */
function simbokInitDetailMenuCustomSelect() {
  const wrapper = document.getElementById("simbokDetailMenuCustom");
  const select = document.getElementById("simbokMasterDetailMenu");

  if (!wrapper || !select) return;

  const trigger = wrapper.querySelector(
    ".simbok-custom-select-trigger"
  );

  const triggerText = trigger.querySelector("span:first-child");

  const optionsBox = wrapper.querySelector(
    ".simbok-custom-select-options"
  );

  // Memperbarui tampilan pilihan aktif.
  const updateDisplay = () => {
    const selected = select.options[select.selectedIndex];

    triggerText.textContent =
      selected?.textContent || "Pilih detail menu";

    trigger.classList.toggle("has-value", !!select.value);

    optionsBox.querySelectorAll(".simbok-custom-option")
      .forEach(option => {
        option.classList.toggle(
          "active",
          option.dataset.value === select.value
        );
      });
  };

  // Membuat daftar pilihan.
  optionsBox.innerHTML = "";

  Array.from(select.options).forEach(option => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "simbok-custom-option";
    button.textContent = option.textContent;
    button.dataset.value = option.value;

    button.addEventListener("click", () => {
      select.value = option.value;

      // Memicu fungsi change yang sudah ada.
      select.dispatchEvent(
        new Event("change", { bubbles: true })
      );

      updateDisplay();

      optionsBox.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    });

    optionsBox.appendChild(button);
  });

  // Membuka dan menutup dropdown.
  trigger.onclick = () => {
    const isOpen = !optionsBox.hidden;

    optionsBox.hidden = isOpen;

    trigger.setAttribute(
      "aria-expanded",
      String(!isOpen)
    );
  };

  // Sinkronisasi jika nilai select berubah dari JavaScript.
  select.addEventListener("change", updateDisplay);

  updateDisplay();
}

/* Mengisi identitas otomatis berdasarkan Detail Menu terpilih. */
function simbokUpdateDetailMenuSnapshot() {
  const select = document.getElementById("simbokMasterDetailMenu");
  if (!select) return;

  const kode = select.value;

  const record = SIMBOK_REF.detailMenu.find(item =>
    String(item.kodeDetailMenu).trim() === String(kode).trim()
  );

  // Kode Detail Menu.
  document.getElementById("simbokMasterKode").value =
    record?.kodeDetailMenu || "";

  // Identitas Menu.
  document.getElementById("simbokMasterKodeMenu").value =
    record?.kodeMenu || "";

  document.getElementById("simbokMasterNamaMenu").value =
    record?.namaMenu || "";

  // Identitas Rincian Menu.
  document.getElementById("simbokMasterKodeRincian").value =
    record?.kodeRincianMenu || "";

  document.getElementById("simbokMasterNamaRincian").value =
    record?.namaRincianMenu || "";

  // Definisi Operasional.
  document.getElementById("simbokMasterDefinisi").value =
    record?.definisiOperasional || "";

  // Rekening Kegiatan.
  document.getElementById("simbokMasterRekKegiatan").value =
    record?.kodeRekeningKegiatan || "";

  document.getElementById("simbokMasterNamaRekKegiatan").value =
    record?.namaRekeningKegiatan || "";
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
async function simbokOpenMasterModal(id = null, mode = "edit") {
  if (mode !== "view" && !simbokIsSuperAdmin()) return;

  await simbokLoadCache();

  const modal = document.getElementById("simbokMasterModal");

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

    // Pilih Detail Menu dan isi identitas otomatis.
    const detailMenu = document.getElementById(
      "simbokMasterDetailMenu"
    );

    detailMenu.value = master.kodeDetailMenu || "";
    simbokUpdateDetailMenuSnapshot();

    document.querySelector(
      "#simbokDetailMenuCustom .simbok-custom-select-trigger span:first-child"
    ).textContent =
      detailMenu.options[detailMenu.selectedIndex]?.textContent ||
      "Pilih detail menu";

    // Pemegang Program.
    simbokPopulatePegawai(master.nipPemegangProgram);

    // Komponen Belanja.
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
      document.getElementById("simbokPlanYearMaster").value || 2027;

    simbokPopulatePegawai();
    simbokAddKomponenRow();

    document.getElementById(
      "simbokMasterModalTitle"
    ).textContent = "Tambah Detail Menu / Kegiatan";

    document.getElementById(
      "simbokSaveMaster"
    ).textContent = "Simpan Detail Menu";
  }

  // Hitung ulang Total Pagu dari seluruh komponen belanja.
  simbokUpdateMasterTotal();

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

  // Reset identitas Detail Menu.
  const detailMenu = document.getElementById(
    "simbokMasterDetailMenu"
  );

  if (detailMenu) {
    detailMenu.value = "";
  }

  // Reset tampilan custom dropdown.
  const customSelect = document.getElementById(
    "simbokDetailMenuCustom"
  );

  if (customSelect) {
    const trigger = customSelect.querySelector(
      ".simbok-custom-select-trigger"
    );

    const optionsBox = customSelect.querySelector(
      ".simbok-custom-select-options"
    );

    if (trigger) {
      const text = trigger.querySelector("span:first-child");

      if (text) {
        text.textContent = "Pilih detail menu";
      }

      trigger.setAttribute("aria-expanded", "false");
    }

    if (optionsBox) {
      optionsBox.hidden = true;

      optionsBox.querySelectorAll(".simbok-custom-option")
        .forEach(option => {
          option.classList.remove("active");
        });
    }
  }

  // Reset seluruh identitas otomatis.
  const fieldIds = [
    "simbokMasterKode",
    "simbokMasterKodeMenu",
    "simbokMasterNamaMenu",
    "simbokMasterKodeRincian",
    "simbokMasterNamaRincian",
    "simbokMasterDefinisi",
    "simbokMasterRekKegiatan",
    "simbokMasterNamaRekKegiatan"
  ];

  fieldIds.forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });

  // Reset daftar komponen belanja.
  const komponenList = document.getElementById(
    "simbokKomponenList"
  );

  if (komponenList) {
    komponenList.innerHTML = "";
  }

  // Reset total anggaran.
  const total = document.getElementById(
    "simbokMasterTotal"
  );

  if (total) {
    total.textContent = simbokCurrency(0);
  }
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
          <select class="simbok-component-people-unit" required>
            ${simbokBuildUnitOptions(
              "ORANG",
              data.satuanOrang ?? "Orang"
            )}
          </select>
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
          <select class="simbok-component-location-unit" required>
            ${simbokBuildUnitOptions(
              "LOKASI",
              data.satuanLokasi ?? "Lokasi"
            )}
          </select>
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
          <select class="simbok-component-frequency-unit" required>
            ${simbokBuildUnitOptions(
              "FREKUENSI",
              data.satuanFrekuensi ?? "Kali"
            )}
          </select>
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

        <!-- Total Belanja -->
        <div class="simbok-component-total is-budget">
          <svg viewBox="0 0 24 24" class="simbok-summary-icon green">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="M3 10h18M7 15h3"/>
          </svg>
          <div>
            <span>Total Belanja</span>
            <strong data-component-budget>Rp0</strong>
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

  // Mengembalikan pilihan Jenis Belanja berdasarkan data tersimpan.
  const savedKey =
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

/* Membuat pilihan satuan dari Master Satuan. */
function simbokBuildUnitOptions(kelompok, selected = "") {
  const normalize = value => String(value || "")
    .trim()
    .toUpperCase();

  const keyword = normalize(kelompok);

  const units = SIMBOK_REF.satuan.filter(item => {
    const group = normalize(item["KELOMPOK SATUAN"]);

    return (
      item.STATUS.toUpperCase() === "AKTIF" &&
      group.includes(keyword)
    );
  });

  const options = units.map(item => {
    const name = item["NAMA SATUAN"];

    return `
      <option
        value="${simbokEscape(name)}"
        ${name === selected ? "selected" : ""}
      >
        ${simbokEscape(name)}
      </option>
    `;
  });

  // Pertahankan satuan lama ketika mengedit,
  // meskipun satuan tersebut tidak lagi aktif di master.
  if (selected && !units.some(item => item["NAMA SATUAN"] === selected)) {
    options.unshift(`
      <option value="${simbokEscape(selected)}" selected>
        ${simbokEscape(selected)}
      </option>
    `);
  }

  return `
    <option value="">Pilih satuan</option>
    ${options.join("")}
  `;
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

  // Menampilkan total belanja per komponen.
  row.querySelector("[data-component-budget]").textContent =
    simbokCurrency(budget);

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

/* Menampilkan daftar Detail Menu dalam bentuk kartu premium. */
function simbokRenderMasters() {
  const wrap = document.getElementById("simbokMasterTableWrap");
  const count = document.getElementById("simbokMasterCount");
  const year = Number(
    document.getElementById("simbokPlanYearMaster")?.value || 2027
  );

  const search = document.getElementById("simbokMasterSearch")
    ?.value.trim().toLowerCase() || "";

  const menuFilter = document.getElementById(
    "simbokMasterMenuFilter"
  )?.value || "";

  if (!wrap || !count) return;

  const addButton = document.getElementById("simbokOpenMasterModal");

  if (addButton) {
    addButton.hidden = !simbokIsSuperAdmin();
  }

  const yearMasters = simbokMasters.filter(master =>
    Number(master.tahunAnggaran) === year
  );

  const filtered = yearMasters.filter(master => {
    const components = master.komponenBelanja || [];

    const searchable = [
      master.kodeDetailMenu,
      master.namaDetailMenu,
      master.kodeMenu,
      master.namaMenu,
      master.kodeRincianMenu,
      master.namaRincianMenu,
      master.namaPemegangProgram,
      master.nipPemegangProgram,
      ...components.map(component => component.jenisBelanja)
    ].join(" ").toLowerCase();

    return searchable.includes(search) &&
      (!menuFilter || master.kodeMenu === menuFilter);
  });

  count.textContent = `${yearMasters.length} detail menu`;

  // Sinkronisasi dropdown workspace bulanan.
  const monthlySelect = document.getElementById("simbokPlanMenuSelect");

  if (monthlySelect) {
    const previousValue = monthlySelect.value;

    monthlySelect.innerHTML =
      '<option value="">Pilih detail menu</option>';

    yearMasters.forEach(master => {
      const option = document.createElement("option");

      option.value = master.id;
      option.textContent =
        `${master.kodeRincianMenu} — ${master.namaRincianMenu}`;

      monthlySelect.appendChild(option);
    });

    if (
      Array.from(monthlySelect.options)
        .some(option => option.value === previousValue)
    ) {
      monthlySelect.value = previousValue;
    }
  }

  if (!filtered.length) {
    wrap.innerHTML = `
      <div class="simbok-plan-empty simbok-master-empty">
        <span class="simbok-master-empty-icon">⌕</span>

        <strong>
          ${yearMasters.length
            ? "Data tidak ditemukan"
            : "Belum ada Dokumen Master BOK"}
        </strong>

        <p>
          ${yearMasters.length
            ? "Coba ubah kata pencarian atau filter menu."
            : `Belum ada detail menu untuk Tahun Anggaran ${year}.`}
        </p>
      </div>
    `;
  } else {
    const canManage = simbokIsSuperAdmin();

    wrap.innerHTML = filtered.map(master => {
      const components = master.komponenBelanja || [];

      const componentChips = components.length
        ? components.map(component => `
            <span class="simbok-master-component-chip">
              ${simbokEscape(component.jenisBelanja || "-")}
            </span>
          `).join("")
        : `<span class="simbok-master-component-empty">
             Belum ada komponen
           </span>`;

      const actions = `
        <div class="simbok-master-card-actions">

          <button
            type="button"
            class="simbok-master-view"
            data-master-view="${master.id}"
            title="Lihat Detail Menu"
            aria-label="Lihat Detail Menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Detail</span>
          </button>

          ${canManage ? `
            <button
              type="button"
              data-master-edit="${master.id}"
              title="Edit"
              aria-label="Edit"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16z"/>
              </svg>
              <span>Edit</span>
            </button>

            <button
              type="button"
              class="is-danger"
              data-master-delete="${master.id}"
              title="Hapus"
              aria-label="Hapus"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3"/>
              </svg>
              <span>Hapus</span>
            </button>
          ` : ""}

        </div>
      `;

      return `
        <article class="simbok-master-card simbok-master-card-premium">

          <!-- Identitas utama -->
          <div class="simbok-master-card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m12 3 9 4.5-9 4.5-9-4.5z"/>
              <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>
            </svg>
          </div>

          <div class="simbok-master-card-content">

            <div class="simbok-master-card-heading">
              <h4>
                ${simbokEscape(master.namaDetailMenu || "-")}
              </h4>

              <span class="simbok-master-year-badge">
                TA ${simbokEscape(master.tahunAnggaran)}
              </span>
            </div>

            <!-- Nama Menu -->
            <div class="simbok-master-info-row">
              <span class="simbok-master-info-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </span>

              <span class="simbok-master-info-label">Menu :</span>

              <strong>
                ${simbokEscape(master.namaMenu || "-")}
              </strong>
            </div>

            <!-- Nama Rincian Menu -->
            <div class="simbok-master-info-row">
              <span class="simbok-master-info-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="4" width="4" height="4" rx="1"/>
                  <rect x="4" y="10" width="4" height="4" rx="1"/>
                  <rect x="4" y="16" width="4" height="4" rx="1"/>
                  <path d="M12 6h8M12 12h8M12 18h8"/>
                </svg>
              </span>

              <span class="simbok-master-info-label">Rincian Menu :</span>

              <span>
                ${simbokEscape(master.namaRincianMenu || "-")}
              </span>
            </div>

            <!-- Pemegang Program -->
            <div class="simbok-master-info-row simbok-master-holder">
              <span class="simbok-master-info-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6z"/>
                </svg>
              </span>

              <span class="simbok-master-info-label">
                Pemegang Program :
              </span>

              <div class="simbok-master-holder-content">
                <strong>
                  ${simbokEscape(master.namaPemegangProgram || "-")}
                </strong>

                <span class="simbok-master-holder-nip">
                  <b>NIP :</b>
                  ${simbokEscape(master.nipPemegangProgram || "-")}
                </span>
              </div>
            </div>

            <div class="simbok-master-card-divider"></div>

            <!-- Kode Detail dan Komponen -->
            <div class="simbok-master-card-bottom">

              <!-- Kode Detail Menu -->
              <div class="simbok-master-detail-code">

                <span class="simbok-master-detail-label">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.5 13.5 13 21l-10-10V3h8z"/>
                    <circle cx="7.5" cy="7.5" r="1.5"/>
                  </svg>
                  Kode Detail Menu
                </span>

                <strong>
                  ${simbokEscape(master.kodeDetailMenu || "-")}
                </strong>

              </div>

              <!-- Komponen -->
              <div class="simbok-master-component-list">

                <strong>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m12 2 9 5-9 5-9-5z"/>
                    <path d="m3 12 9 5 9-5"/>
                    <path d="m3 17 9 5 9-5"/>
                  </svg>

                  <span class="simbok-master-component-count">
                    ${components.length}
                  </span>

                  Komponen
                </strong>

                <div class="simbok-master-card-components">
                  ${componentChips}
                </div>

              </div>

            </div>
          
          </div> <!-- Penutup simbok-master-card-content -->

          <!-- Total Pagu dan Aksi -->
          <div class="simbok-master-card-side">

            <div class="simbok-master-card-budget">

              <div class="simbok-master-budget-heading">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="6" width="18" height="15" rx="2"/>
                  <path d="M16 3v6M8 3v6M3 11h18"/>
                </svg>
                <small>Total Pagu</small>
              </div>

              <strong>
                ${simbokCurrency(master.totalPagu)}
              </strong>

              <!-- Ilustrasi tumpukan uang -->
              <div class="simbok-master-budget-illustration">
                <svg viewBox="0 0 180 105" aria-hidden="true">

                  <!-- Koin belakang -->
                  <ellipse cx="124" cy="27" rx="25" ry="9"/>
                  <path d="M99 27v38c0 5 11 9 25 9s25-4 25-9V27"/>
                  <path d="M99 40c0 5 11 9 25 9s25-4 25-9"/>
                  <path d="M99 53c0 5 11 9 25 9s25-4 25-9"/>

                  <!-- Koin depan -->
                  <ellipse cx="62" cy="55" rx="29" ry="11"/>
                  <path d="M33 55v22c0 6 13 11 29 11s29-5 29-11V55"/>
                  <path d="M33 67c0 6 13 11 29 11s29-5 29-11"/>

                  <!-- Koin logo rupiah -->
                  <circle cx="101" cy="68" r="25"/>
                  <circle cx="101" cy="68" r="19"/>
                  <text x="101" y="75" text-anchor="middle"
                    font-size="21" font-weight="800"
                    fill="currentColor" stroke="none">Rp</text>

                </svg>
              </div>

            </div>

            ${actions}

          </div>

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

/* Membuka Detail Menu dalam mode hanya-baca. */
async function simbokViewMaster(id) {
  await simbokOpenMasterModal(id, "view");
}


/* ======================================================
   SIMBOK — PREMIUM FEEDBACK MODAL
====================================================== */

function simbokShowFeedbackModal({
  type = "success",
  title = "",
  message = "",
  confirmText = "Mengerti",
  cancelText = "",
  confirmLabel = "",
  onConfirm = null
}) {
  return new Promise(resolve => {
    document.getElementById("simbokFeedbackModal")?.remove();

    const isConfirm = type === "confirm" || type === "danger";
    const isDanger = type === "danger";
    const isError = type === "error";

    const icon = isConfirm || isDanger
      ? "!"
      : isError
        ? "×"
        : "✓";

    const backdrop = document.createElement("div");
    backdrop.id = "simbokFeedbackModal";
    backdrop.className = "simbok-feedback-backdrop";

    backdrop.innerHTML = `
      <section
        class="simbok-feedback-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simbokFeedbackTitle"
      >
        <button
          type="button"
          class="simbok-feedback-close"
          data-feedback-cancel
          aria-label="Tutup"
        >×</button>

        <div class="simbok-feedback-icon ${type}">
          ${icon}
        </div>

        <div class="simbok-feedback-content">
          <h3 id="simbokFeedbackTitle">
            ${simbokEscape(title)}
          </h3>

          <p>${simbokEscape(message)}</p>
        </div>

        <div class="simbok-feedback-actions">
          ${
            isConfirm
              ? `
                <button
                  type="button"
                  class="simbok-feedback-btn secondary"
                  data-feedback-cancel
                >${simbokEscape(cancelText || "Batal")}</button>
              `
              : ""
          }

          <button
            type="button"
            class="simbok-feedback-btn ${isDanger ? "danger" : "primary"}"
            data-feedback-confirm
          >
            ${simbokEscape(confirmText)}
          </button>
        </div>
      </section>
    `;

    document.body.appendChild(backdrop);

    requestAnimationFrame(() => {
      backdrop.classList.add("show");
    });

    const close = result => {
      backdrop.classList.remove("show");

      setTimeout(() => {
        backdrop.remove();
        resolve(result);
      }, 180);
    };

    backdrop.querySelectorAll("[data-feedback-cancel]")
      .forEach(button => {
        button.addEventListener("click", () => close(false));
      });

    backdrop.querySelector("[data-feedback-confirm]")
      .addEventListener("click", async () => {
        if (onConfirm) {
          await onConfirm();
        }

        close(true);
      });

    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) {
        close(false);
      }
    });

    const escapeHandler = event => {
      if (
        event.key === "Escape" &&
        document.getElementById("simbokFeedbackModal") === backdrop
      ) {
        document.removeEventListener("keydown", escapeHandler);
        close(false);
      }
    };

    document.addEventListener("keydown", escapeHandler);
  });
}


/* ------------------------------------------------------
   SIMPAN DETAIL MENU
------------------------------------------------------ */

/* Memvalidasi dan menyimpan Master Kegiatan ke Firestore. */
async function simbokSaveMaster(event) {
  event.preventDefault();

  if (!simbokIsSuperAdmin()) return;

  const saveButton = document.getElementById("simbokSaveMaster");

  if (saveButton.disabled) return;

  const year = Number(
    document.getElementById("simbokMasterTahun").value
  );

  const detailCode = document.getElementById(
    "simbokMasterDetailMenu"
  ).value;

  const detail = SIMBOK_REF.detailMenu.find(item =>
    String(item.kodeDetailMenu).trim() === String(detailCode).trim()
  );

  const components = simbokReadKomponen();

  if (!Number.isInteger(year) || year < 2027 || year > 2100) {
    window.alert("Tahun Anggaran dimulai dari 2027.");
    return;
  }

  if (!detail || !detailCode) {
    window.alert("Pilih Detail Menu terlebih dahulu.");
    return;
  }

  const nip = document.getElementById(
    "simbokMasterNip"
  ).value.trim();

  const namaPemegangSelect = document.getElementById(
    "simbokMasterPemegang"
  );

  const namaPemegang =
    namaPemegangSelect.selectedOptions[0]?.textContent.trim() || "";

  if (!nip || !namaPemegang || !namaPemegangSelect.value) {
    window.alert("Lengkapi NIP/NRP dan Nama Pemegang Program.");
    return;
  }

  if (namaPemegang === nip) {
    window.alert(
      "Nama Pemegang Program tidak valid. Silakan pilih nama pegawai yang benar."
    );
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
    window.alert(
      "Lengkapi seluruh field pada setiap komponen jenis belanja."
    );
    return;
  }

  // Cegah Detail Menu yang sama terdaftar dua kali
  // dalam Tahun Anggaran yang sama.
  const duplicate = simbokMasters.some(master =>
    Number(master.tahunAnggaran) === year &&
    String(master.kodeDetailMenu) === String(detailCode) &&
    master.id !== simbokEditingId
  );

  if (duplicate) {
    window.alert(
      "Detail Menu tersebut sudah terdaftar pada Tahun Anggaran ini."
    );
    return;
  }

  const totalPagu = components.reduce(
    (sum, item) => sum + Number(item.totalPagu || 0),
    0
  );

  const masterData = {
    tahunAnggaran: year,

    kodeDetailMenu: detail.kodeDetailMenu,
    namaDetailMenu: detail.namaDetailMenu || "",

    kodeMenu: detail.kodeMenu || "",
    namaMenu: detail.namaMenu || "",

    kodeRincianMenu: detail.kodeRincianMenu || "",
    namaRincianMenu: detail.namaRincianMenu || "",

    definisiOperasional: detail.definisiOperasional || "",

    kodeRekeningKegiatan: detail.kodeRekeningKegiatan || "",
    namaRekeningKegiatan: detail.namaRekeningKegiatan || "",

    nipPemegangProgram: nip,
    namaPemegangProgram: namaPemegang,

    komponenBelanja: components,
    totalPagu,

    updatedAt: serverTimestamp()
  };

  saveButton.disabled = true;
  const originalText = saveButton.textContent;
  saveButton.textContent = "Menyimpan...";

  try {
    if (simbokEditingId !== null) {
      // UPDATE dokumen yang sudah ada.
      const existing = simbokMasters.find(
        item => item.id === simbokEditingId
      );

      if (!existing?.firestoreId) {
        throw new Error("ID dokumen Firestore tidak ditemukan.");
      }

      await updateDoc(
        doc(
          smartofficeFirestore,
          SIMBOK_COLLECTION_MASTER,
          existing.firestoreId
        ),
        masterData
      );

    } else {
      // INSERT dokumen baru.
      masterData.createdAt = serverTimestamp();

      const masterDocId =
        `${year}_${detail.kodeDetailMenu}`;

      await setDoc(
        doc(
          smartofficeFirestore,
          SIMBOK_COLLECTION_MASTER,
          masterDocId
        ),
        {
          ...masterData,
          createdAt: serverTimestamp()
        }
      );
    }

    // Ambil ulang data agar cache sesuai dengan Firestore.
    await simbokLoadMasters();

    document.getElementById("simbokPlanYearMaster").value = year;
    document.getElementById("simbokPlanYearMonthly").value = year;
    document.getElementById("simbokPlanYearRecap").value = year;

    simbokCloseMasterModal();
    simbokRenderMasters();

    await simbokShowFeedbackModal({
      type: "success",
      title: "Berhasil Disimpan!",
      message: "Data Master Kegiatan BOK telah berhasil disimpan ke database.",
      confirmText: "Selesai"
    });

  } catch (error) {
    console.error("[simBOK] Gagal menyimpan Master Kegiatan:", error);

    window.alert(
      "Master Kegiatan gagal disimpan ke Firestore. " +
      (error.message || "Periksa koneksi dan izin akses.")
    );

  } finally {
    saveButton.disabled = false;
    saveButton.textContent = originalText;
  }
}


/* ------------------------------------------------------
   HAPUS DETAIL MENU
------------------------------------------------------ */

/* Menghapus dokumen Master Kegiatan dari Firestore. */
async function simbokDeleteMaster(id) {
  if (!simbokIsSuperAdmin()) return;

  const master = simbokMasters.find(
    item => item.id === id
  );

  if (!master) return;

  if (!master.firestoreId) {
    await simbokShowFeedbackModal({
      type: "error",
      title: "ID Dokumen Tidak Ditemukan",
      message: "ID dokumen Firestore tidak ditemukan. Data tidak dapat dihapus.",
      confirmText: "Mengerti"
    });

    return;
  }

  /* KONFIRMASI HAPUS */
  const confirmed = await simbokShowFeedbackModal({
    type: "danger",
    title: "Hapus Master Kegiatan?",
    message: `Apakah Anda yakin ingin menghapus Detail Menu "${master.namaRincianMenu}"? Data yang dihapus tidak dapat dikembalikan.`,
    confirmText: "Ya, Hapus",
    cancelText: "Batal"
  });

  if (!confirmed) return;

  try {
    await deleteDoc(
      doc(
        smartofficeFirestore,
        SIMBOK_COLLECTION_MASTER,
        master.firestoreId
      )
    );

    /* PERBARUI CACHE */
    simbokMasters = simbokMasters.filter(
      item => item.id !== id
    );

    simbokRenderMasters();

    /* NOTIFIKASI BERHASIL */
    await simbokShowFeedbackModal({
      type: "success",
      title: "Berhasil Dihapus!",
      message: "Master Kegiatan BOK berhasil dihapus dari database.",
      confirmText: "Selesai"
    });

  } catch (error) {
    console.error(
      "[simBOK] Gagal menghapus Master Kegiatan:",
      error
    );

    await simbokShowFeedbackModal({
      type: "error",
      title: "Gagal Menghapus!",
      message: error.message ||
        "Terjadi kesalahan saat menghapus data. Periksa koneksi dan izin akses.",
      confirmText: "Mengerti"
    });
  }
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
   SIMBOK — RENCANA PENGGUNAAN DANA
====================================================== */

/* Helper pembentuk ID dokumen */
function simbokGetRPDDocumentId(master) {
  return `RPD_${master.tahunAnggaran}_${master.kodeDetailMenu}`;
}

/* Pemuatan data RPD */
async function simbokLoadRPD() {
  try {
    const records = await simbokGetCollection("simbok_rpd");

    simbokRPDData = records.map(item => ({
      ...item,
      tahunAnggaran: Number(item.tahunAnggaran || 0),
      totalRPD: Number(item.totalRPD || 0),
      komponenRPD: Array.isArray(item.komponenRPD)
        ? item.komponenRPD
        : []
    }));

    simbokRPDLoaded = true;

    return simbokRPDData;

  } catch (error) {
    console.error("Gagal memuat data RPD:", error);
    simbokRPDLoaded = false;
    throw error;
  }
}

/* ======================================================
   HITUNG TOTAL RPD PER DETAIL MENU
====================================================== */

function simbokCalculateTotalRPD(rpd) {
  if (!rpd || !Array.isArray(rpd.komponenRPD)) return 0;

  return rpd.komponenRPD.reduce((total, komponen) => {
    if (komponen.digunakan === false) return total;

    const bulan = komponen.bulan || {};

    const totalKomponen = Object.values(bulan).reduce(
      (sum, dataBulan) => {
        return sum + Number(dataBulan?.jumlah || 0);
      },
      0
    );

    return total + totalKomponen;
  }, 0);
}


/* ======================================================
   SIMBOK — RENDER DAFTAR RPD
   CSS DAN STRUKTUR KARTU MANDIRI
====================================================== */

async function simbokRenderRPD() {
  const wrap = document.getElementById("simbokRpdCardList");
  const count = document.getElementById("simbokRpdCount");
  const searchInput = document.getElementById("simbokRpdSearch");
  const yearSelect = document.getElementById("simbokPlanYearRpd");
  const menuFilter = document.getElementById("simbokRpdMenuFilter");
  const selectedMenu = String(menuFilter?.value || "");

  if (!wrap || !count || !yearSelect) return;

  const year = Number(yearSelect.value || 2027);
  const search = String(searchInput?.value || "")
    .trim()
    .toLowerCase();

  wrap.innerHTML = `
    <div class="simbok-plan-empty">
      Memuat daftar RPD...
    </div>
  `;

  try {
    if (!simbokRPDLoaded) {
      await simbokLoadRPD();
    }

    const yearMasters = simbokMasters.filter(master =>
      Number(master.tahunAnggaran) === year
    );

    const filtered = yearMasters.filter(master => {
      const searchable = [
        master.kodeDetailMenu,
        master.namaDetailMenu,
        master.namaMenu,
        master.namaRincianMenu,
        master.namaPemegangProgram,
        master.nipPemegangProgram
      ].join(" ").toLowerCase();

      const matchSearch = searchable.includes(search);

      const matchMenu = !selectedMenu ||
        String(master.kodeMenu || "") === selectedMenu;

      return matchSearch && matchMenu;
    });

    count.textContent = `${yearMasters.length} detail menu`;

    if (!filtered.length) {
      wrap.innerHTML = `
        <div class="simbok-rpd-empty">
          <span class="simbok-rpd-empty-icon">⌕</span>
          <strong>
            ${yearMasters.length
              ? "Data tidak ditemukan"
              : "Belum ada Detail Menu"}
          </strong>
          <p>
            ${yearMasters.length
              ? "Coba ubah kata pencarian."
              : `Belum ada Detail Menu untuk Tahun Anggaran ${year}.`}
          </p>
        </div>
      `;

      return;
    }

    const bulan = [
      "Januari", "Februari", "Maret", "April",
      "Mei", "Juni", "Juli", "Agustus",
      "September", "Oktober", "November", "Desember"
    ];

    wrap.innerHTML = filtered.map(master => {
      const rpdId = simbokGetRPDDocumentId(master);

      const rpd = simbokRPDData.find(item =>
        item.id === rpdId
      );

      const komponen = rpd?.komponenRPD || [];

      const komponenTerpilih = komponen.filter(item =>
        item.digunakan !== false
      );

      const totalPagu = Number(master.totalPagu || 0);

      const totalRPD = rpd
        ? simbokCalculateTotalRPD(rpd)
        : 0;

      const sisaAnggaran = totalPagu - totalRPD;

      const bulanTerkunci = komponen.reduce((total, item) => {
        return total + bulan.filter(namaBulan =>
          item.bulan?.[namaBulan]?.locked === true
        ).length;
      }, 0);

      const statusRPD = !rpd
        ? "Belum dibuat"
        : totalRPD > totalPagu
          ? "Melebihi Pagu"
          : totalRPD > 0
            ? "Sudah diisi"
            : "Belum diisi";

      const canManage = simbokCanManageRPD(master);

      return `
        <article class="simbok-rpd-card">

          <!-- IDENTITAS KARTU -->
          <div class="simbok-rpd-card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m12 3 9 5-9 5-9-5 9-5z"/>
              <path d="m3 12 9 5 9-5"/>
              <path d="m3 16 9 5 9-5"/>
            </svg>
          </div>

          <!-- INFORMASI DETAIL MENU -->
          <div class="simbok-rpd-card-content">

            <div class="simbok-rpd-card-heading">
              <h4>
                ${simbokEscape(master.namaDetailMenu || "-")}
              </h4>

              <span class="simbok-rpd-year-badge">
                TA ${simbokEscape(master.tahunAnggaran)}
              </span>
            </div>
            
            <div class="simbok-rpd-info-list">

              <!-- MENU -->
              <div class="simbok-rpd-info-row">
                <span class="simbok-rpd-info-icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </span>
                <span class="simbok-rpd-info-label">Menu :</span>
                <strong>${simbokEscape(master.namaMenu || "-")}</strong>
              </div>

              <!-- RINCIAN MENU -->
              <div class="simbok-rpd-info-row">
                <span class="simbok-rpd-info-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 6h11M9 12h11M9 18h11"/>
                    <circle cx="4" cy="6" r="1"/>
                    <circle cx="4" cy="12" r="1"/>
                    <circle cx="4" cy="18" r="1"/>
                  </svg>
                </span>
                <span class="simbok-rpd-info-label">Rincian Menu :</span>
                <strong>${simbokEscape(master.namaRincianMenu || "-")}</strong>
              </div>

              <!-- PEMEGANG PROGRAM -->
              <div class="simbok-rpd-info-row">
                <span class="simbok-rpd-info-icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7"/>
                  </svg>
                </span>
                <span class="simbok-rpd-info-label">Pemegang Program :</span>

                <div class="simbok-rpd-holder">
                  <strong>${simbokEscape(master.namaPemegangProgram || "-")}</strong>
                  <span class="simbok-rpd-holder-nip">
                    <b>NIP :</b>
                    ${simbokEscape(master.nipPemegangProgram || "-")}
                  </span>
                </div>
              </div>

            </div>

            <!-- KODE DAN KOMPONEN -->
            <div class="simbok-rpd-card-footer">

              <div class="simbok-rpd-code">
                <span class="simbok-rpd-code-label">
                  <svg viewBox="0 0 24 24">
                    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/>
                    <circle cx="8" cy="8" r="1.5"/>
                  </svg>
                  Kode Detail Menu
                </span>

                <strong>${simbokEscape(master.kodeDetailMenu || "-")}</strong>
              </div>

              <div class="simbok-rpd-components">

                <div class="simbok-rpd-components-heading">
                  <svg viewBox="0 0 24 24">
                    <path d="m12 3 9 5-9 5-9-5 9-5z"/>
                    <path d="m3 12 9 5 9-5"/>
                    <path d="m3 16 9 5 9-5"/>
                  </svg>

                  <strong>
                    ${komponenTerpilih.length} Komponen
                  </strong>
                </div>

                <div class="simbok-rpd-component-chips">
                  ${
                    komponenTerpilih.length
                      ? komponenTerpilih.map(item => `
                          <span class="simbok-rpd-component-chip">
                            ${simbokEscape(item.jenisBelanja || item.kodeRekeningBelanja || "Komponen")}
                          </span>
                        `).join("")
                      : `<span class="simbok-rpd-component-empty">Belum ada komponen dipilih</span>`
                  }
                </div>

                <div class="simbok-rpd-locked-info">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="11" rx="2"/>
                    <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
                    <path d="M12 14v3"/>
                  </svg>

                  <span>
                    Bulan terkunci: <strong>${bulanTerkunci} / 12</strong>
                  </span>
                </div>

              </div>

            </div>           

          </div>

          <!-- RINGKASAN ANGGARAN -->
          <aside class="simbok-rpd-card-side">
            
            <div class="simbok-rpd-budget">

              <div class="simbok-rpd-budget-item">
                <div class="simbok-rpd-budget-heading">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="6" width="18" height="14" rx="2"/>
                    <path d="M3 10h18M7 15h3"/>
                    <path d="M7 3h10"/>
                  </svg>
                  <span>Total Pagu</span>
                </div>
                <strong>${simbokCurrency(totalPagu)}</strong>
              </div>

              <div class="simbok-rpd-budget-item">
                <div class="simbok-rpd-budget-heading">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="3" width="16" height="18" rx="2"/>
                    <path d="M8 8h8M8 12h8M8 16h5"/>
                  </svg>
                  <span>Total RPD</span>
                </div>
                <strong>${simbokCurrency(totalRPD)}</strong>
              </div>

              <div class="simbok-rpd-budget-item">
                <div class="simbok-rpd-budget-heading">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M8 12h8M12 8v8"/>
                  </svg>
                  <span>Sisa Anggaran</span>
                </div>
                <strong>${simbokCurrency(sisaAnggaran)}</strong>
              </div>

              <span class="simbok-rpd-status ${
                totalRPD > totalPagu
                  ? "is-warning"
                  : rpd && totalRPD > 0
                    ? "is-filled"
                    : ""
              }">
                ${statusRPD}
              </span>

            </div>

            <!-- AKSI RPD -->
            <div class="simbok-rpd-actions">

              <button
                type="button"
                class="simbok-rpd-edit-button"
                data-rpd-edit="${simbokEscape(rpdId)}"
                ${canManage ? "" : "disabled"}
                title="${
                  canManage
                    ? (rpd ? "Edit RPD" : "Buat RPD")
                    : "Tidak memiliki akses edit"
                }"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16z"/>
                </svg>

                <span>${rpd ? "Edit RPD" : "Buat RPD"}</span>
              </button>

            </div>

          </aside>

        </article>
      `;
    }).join("");

  } catch (error) {
    console.error("Gagal menampilkan daftar RPD:", error);

    wrap.innerHTML = `
      <div class="simbok-plan-empty">
        Gagal memuat data RPD. Silakan coba kembali.
      </div>
    `;
  }
}


/* ======================================================
   MEMBUKA MODAL BUAT / EDIT RPD
====================================================== */

async function simbokOpenRPDModal(master) {
  if (!master) return;

  if (!simbokCanManageRPD(master)) {
    return;
  }

  try {
    await simbokLoadCache();

    if (!simbokRPDLoaded) {
      await simbokLoadRPD();
    }

    const modal = document.getElementById("simbokRpdModal");
    const rpdId = simbokGetRPDDocumentId(master);

    if (!modal) return;

    simbokRpdLastFocus = document.activeElement;
    simbokRpdEditingMaster = master;

    const rpd = simbokRPDData.find(item => item.id === rpdId);

    // Identitas Detail Menu.
    document.getElementById("simbokRpdTahun").value =
      master.tahunAnggaran || "";

    document.getElementById("simbokRpdKode").value =
      master.kodeDetailMenu || "";

    document.getElementById("simbokRpdNama").value =
      master.namaDetailMenu || "";

    document.getElementById("simbokRpdPemegang").value =
      master.namaPemegangProgram || "";

    document.getElementById("simbokRpdNip").value =
      master.nipPemegangProgram || "";

    // Ringkasan anggaran.
    const totalPagu = Number(master.totalPagu || 0);
    const totalRPD = rpd
      ? simbokCalculateTotalRPD(rpd)
      : 0;

    const sisa = totalPagu - totalRPD;

    document.getElementById("simbokRpdPagu").textContent =
      simbokCurrency(totalPagu);

    document.getElementById("simbokRpdTotal").textContent =
      simbokCurrency(totalRPD);

    document.getElementById("simbokRpdSisa").textContent =
      simbokCurrency(sisa);

    document.getElementById("simbokRpdFooterSisa").textContent =
      simbokCurrency(sisa);

    document.getElementById("simbokRpdModalTitle").textContent =
      rpd ? "Edit Rencana Penggunaan Dana" : "Buat Rencana Penggunaan Dana";

    document.getElementById("simbokSaveRpd").textContent =
      rpd ? "Simpan Perubahan" : "Simpan RPD";

    // Tampilkan komponen Master dan pilihan RPD yang tersimpan.
    simbokRenderRPDComponents(master, rpd);

    // Tampilkan modal.
    modal.hidden = false;
    document.body.classList.add("simbok-modal-open");

    document.getElementById("simbokCloseRpdModal").focus();

  } catch (error) {
    console.error("Gagal membuka modal RPD:", error);
    alert("Gagal membuka formulir RPD. Silakan coba kembali.");
  }
}

/* ======================================================
   MENUTUP MODAL RPD
====================================================== */

function simbokCloseRPDModal() {
  const modal = document.getElementById("simbokRpdModal");

  if (!modal) return;

  modal.hidden = true;
  document.body.classList.remove("simbok-modal-open");

  simbokRpdEditingMaster = null;

  if (
    simbokRpdLastFocus &&
    typeof simbokRpdLastFocus.focus === "function"
  ) {
    simbokRpdLastFocus.focus();
  }
}


/* ======================================================
   SIMBOK RPD — RENCANA BULANAN
====================================================== */

const SIMBOK_RPD_MONTHS = [
  "Januari", "Februari", "Maret", "April",
  "Mei", "Juni", "Juli", "Agustus",
  "September", "Oktober", "November", "Desember"
];

let simbokRpdOpenMonth = "Januari";


/* Membentuk draft komponen dan data bulanan. */
function simbokRenderRPDComponents(master, rpd = null) {
  if (!master) return;

  const masterComponents = Array.isArray(master.komponenBelanja)
    ? master.komponenBelanja
    : [];

  const savedComponents = Array.isArray(rpd?.komponenRPD)
    ? rpd.komponenRPD
    : [];

  simbokRpdDraftComponents = masterComponents.map(component => {
    const saved = savedComponents.find(item =>
      String(item.key) === String(component.key)
    );

    const bulanTersimpan = saved?.bulan || {};

    const bulan = {};

    SIMBOK_RPD_MONTHS.forEach(namaBulan => {
      const data = bulanTersimpan[namaBulan] || {};

      bulan[namaBulan] = {
        digunakan: data.digunakan === true,
        jumlahLokasi: Number(data.jumlahLokasi ?? component.jumlahLokasi ?? 0),
        frekuensi: Number(data.frekuensi ?? component.frekuensi ?? 0),
        hargaSatuan: Number(data.hargaSatuan ?? component.hargaSatuan ?? 0),
        jumlah: Number(data.jumlah || 0),
        locked: data.locked === true
      };
    });

    return {
      ...component,
      bulan
    };
  });

  simbokRpdOpenMonth = "Januari";

  simbokRenderRPDMonthlyList();
  simbokUpdateRPDSummary();
}


/* Menghitung anggaran satu komponen pada satu bulan. */
function simbokCalculateRPDMonthComponent(component, namaBulan) {
  const data = component.bulan?.[namaBulan];

  if (!data || data.digunakan !== true) return 0;

  const jumlahOrang = Number(component.jumlahOrang || 0);
  const jumlahLokasi = Number(data.jumlahLokasi || 0);
  const frekuensi = Number(data.frekuensi || 0);
  const hargaSatuan = Number(data.hargaSatuan || 0);

  const volume = jumlahOrang * jumlahLokasi * frekuensi;
  const jumlah = volume * hargaSatuan;

  data.jumlah = jumlah;

  return jumlah;
}


/* Menghitung total seluruh RPD. */
function simbokCalculateDraftRPD() {
  return simbokRpdDraftComponents.reduce((total, component) => {
    return total + SIMBOK_RPD_MONTHS.reduce((subtotal, namaBulan) => {
      return subtotal +
        simbokCalculateRPDMonthComponent(component, namaBulan);
    }, 0);
  }, 0);
}


/* Menampilkan 12 panel bulan. */
function simbokRenderRPDMonthlyList() {
  const wrap = document.getElementById("simbokRpdMonthlyList");
  if (!wrap) return;

  if (!simbokRpdDraftComponents.length) {
    wrap.innerHTML = `
      <div class="simbok-plan-empty">
        Belum ada komponen belanja pada Detail Menu ini.
      </div>
    `;
    return;
  }

  wrap.innerHTML = SIMBOK_RPD_MONTHS.map((namaBulan, index) => {
    const isOpen = simbokRpdOpenMonth === namaBulan;

    const selected = simbokRpdDraftComponents.filter(component =>
      component.bulan[namaBulan]?.digunakan === true
    );

    const totalBulan = selected.reduce((total, component) =>
      total + simbokCalculateRPDMonthComponent(component, namaBulan), 0
    );

    const locked = selected.length > 0 &&
      selected.every(component => component.bulan[namaBulan].locked);

    return `
      <section class="simbok-rpd-month ${isOpen ? "is-open" : ""}"
        data-rpd-month="${namaBulan}">

        <button
          type="button"
          class="simbok-rpd-month-header"
          data-rpd-month-toggle="${namaBulan}"
          aria-expanded="${isOpen}"
        >
          <span class="simbok-rpd-month-number">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <span class="simbok-rpd-month-heading">
            <strong>${namaBulan}</strong>
            <small>
              ${selected.length} komponen dipilih
              ${locked ? " · Terkunci" : ""}
            </small>
          </span>

          <span class="simbok-rpd-month-total">
            ${simbokCurrency(totalBulan)}
          </span>

          <span class="simbok-rpd-month-chevron">⌄</span>
        </button>

        ${isOpen ? `
          <div class="simbok-rpd-month-body">

            <div class="simbok-rpd-month-component-list">

              ${simbokRpdDraftComponents.map(component => {
                const data = component.bulan[namaBulan];
                const isLocked = data.locked === true;

                return `
                  <label class="simbok-rpd-month-component-option">
                    <input
                      type="checkbox"
                      data-rpd-month-component="${simbokEscape(component.key)}"
                      data-rpd-month-name="${namaBulan}"
                      ${data.digunakan ? "checked" : ""}
                      ${isLocked ? "disabled" : ""}
                    >

                    <span>
                      <strong>
                        ${simbokEscape(component.jenisBelanja || "-")}
                      </strong>
                      <small>
                        ${simbokEscape(component.kodeRekeningBelanja || "-")}
                      </small>
                    </span>
                  </label>
                `;
              }).join("")}

            </div>

            <div class="simbok-rpd-month-detail">

              ${selected.length
                ? selected.map(component => {
                    const data = component.bulan[namaBulan];
                    const isLocked = data.locked === true;

                    const jumlahOrang = Number(component.jumlahOrang || 0);
                    const jumlahLokasi = Number(data.jumlahLokasi || 0);
                    const frekuensi = Number(data.frekuensi || 0);
                    const hargaSatuan = Number(data.hargaSatuan || 0);

                    const volume = jumlahOrang * jumlahLokasi * frekuensi;
                    const jumlah = simbokCalculateRPDMonthComponent(
                      component, namaBulan
                    );

                    return `
                      <article class="simbok-rpd-month-detail-card"
                        data-rpd-detail="${simbokEscape(component.key)}">

                        <div class="simbok-rpd-month-detail-heading">
                          <strong>
                            ${simbokEscape(component.jenisBelanja || "-")}
                          </strong>
                          <small>
                            ${simbokEscape(component.kodeRekeningBelanja || "-")}
                          </small>
                        </div>

                        <div class="simbok-rpd-month-fields">

                          <label>
                            Jumlah Orang
                            <input type="number"
                              value="${jumlahOrang}"
                              readonly>
                          </label>

                          <label>
                            Satuan Orang
                            <input type="text"
                              value="${simbokEscape(component.satuanOrang || "Orang")}"
                              readonly>
                          </label>

                          <label>
                            Jumlah Lokasi
                            <input type="number"
                              min="0"
                              step="1"
                              data-rpd-field="jumlahLokasi"
                              data-rpd-key="${simbokEscape(component.key)}"
                              data-rpd-month="${namaBulan}"
                              value="${jumlahLokasi}"
                              ${isLocked ? "readonly" : ""}>
                          </label>

                          <label>
                            Frekuensi
                            <input type="number"
                              min="0"
                              step="1"
                              data-rpd-field="frekuensi"
                              data-rpd-key="${simbokEscape(component.key)}"
                              data-rpd-month="${namaBulan}"
                              value="${frekuensi}"
                              ${isLocked ? "readonly" : ""}>
                          </label>

                          <label>
                            Harga Satuan
                            <input type="number"
                              min="0"
                              step="1"
                              data-rpd-field="hargaSatuan"
                              data-rpd-key="${simbokEscape(component.key)}"
                              data-rpd-month="${namaBulan}"
                              value="${hargaSatuan}"
                              ${isLocked ? "readonly" : ""}>
                          </label>

                          <label>
                            Total Anggaran
                            <input
                              type="text"
                              data-rpd-field="totalAnggaran"
                              value="${simbokCurrency(jumlah)}"
                              readonly
                            >
                          </label>

                        </div>

                        <div class="simbok-rpd-volume-summary">
                          Volume: ${jumlahOrang} × ${jumlahLokasi} × ${frekuensi}
                          = ${volume}
                        </div>

                      </article>
                    `;
                  }).join("")
                : `
                  <div class="simbok-plan-empty">
                    Pilih komponen belanja untuk bulan ${namaBulan}.
                  </div>
                `
              }

            </div>
          </div>
        ` : ""}

      </section>
    `;
  }).join("");
}


/* Memperbarui ringkasan anggaran modal. */
function simbokUpdateRPDSummary() {
  const master = simbokRpdEditingMaster;
  if (!master) return;

  const totalPagu = Number(master.totalPagu || 0);
  const totalRPD = simbokCalculateDraftRPD();
  const sisa = totalPagu - totalRPD;

  document.getElementById("simbokRpdPagu").textContent =
    simbokCurrency(totalPagu);

  document.getElementById("simbokRpdTotal").textContent =
    simbokCurrency(totalRPD);

  document.getElementById("simbokRpdSisa").textContent =
    simbokCurrency(sisa);

  document.getElementById("simbokRpdFooterSisa").textContent =
    simbokCurrency(sisa);

  const warning = document.getElementById("simbokRpdBudgetWarning");

  if (warning) {
    warning.hidden = totalRPD <= totalPagu;
    warning.textContent = totalRPD > totalPagu
      ? "Total RPD melebihi Total Pagu. Periksa kembali anggaran."
      : "";
  }

  const saveButton = document.getElementById("simbokSaveRpd");

  if (saveButton) {
    saveButton.disabled = totalRPD > totalPagu;
  }
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

  /* Event perubahan pilihan Nama Detail Menu. */
  simbokAddHandler(
    document.getElementById("simbokMasterDetailMenu"),
    "change",
    simbokUpdateDetailMenuSnapshot
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
  simbokAddHandler(
    document.getElementById("simbokMasterTableWrap"),
    "click",
    event => {

      // Tombol Detail
      const view = event.target.closest("[data-master-view]");

      // Tombol Edit
      const edit = event.target.closest("[data-master-edit]");

      // Tombol Hapus
      const remove = event.target.closest("[data-master-delete]");

      if (view) {
        simbokViewMaster(Number(view.dataset.masterView));
        return;
      }

      if (edit) {
        simbokEditMaster(Number(edit.dataset.masterEdit));
        return;
      }

      if (remove) {
        simbokDeleteMaster(Number(remove.dataset.masterDelete));
        return;
      }
    }
  );

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

  /* Navigasi internal Master, RPD, Rencana Bulanan, dan Rekap Pagu. */
  const planTabs = Array.from(document.querySelectorAll("[data-plan-tab]"));
  const planViews = Array.from(document.querySelectorAll("[data-plan-view]"));

  planTabs.forEach(tab => {
    simbokAddHandler(tab, "click", () => {
      simbokActivatePlanTab(tab, planTabs, planViews);

      // Muat daftar RPD saat tab RPD dibuka.
      if (tab.dataset.planTab === "rpd") {
        simbokRenderRPD();
      }
    });
  });

  /* Pencarian dan filter daftar RPD. */
  simbokAddHandler(
    document.getElementById("simbokRpdSearch"),
    "input",
    simbokRenderRPD
  );

  simbokAddHandler(
    document.getElementById("simbokRpdMenuFilter"),
    "change",
    () => simbokRenderRPD()
  );

  simbokAddHandler(
    document.getElementById("simbokPlanYearRpd"),
    "change",
    simbokRenderRPD
  );

  simbokAddHandler(
    document.getElementById("simbokRpdResetFilter"),
    "click",
    simbokRenderRPD
  );

  /* Event aksi kartu RPD menggunakan delegation. */
  simbokAddHandler(
    document.getElementById("simbokRpdCardList"),
    "click",
    event => {
      const edit = event.target.closest("[data-rpd-edit]");
      if (!edit) return;

      const master = simbokMasters.find(item =>
        simbokGetRPDDocumentId(item) === edit.dataset.rpdEdit
      );

      if (!master) {
        console.warn("Data Master untuk RPD tidak ditemukan.");
        return;
      }

      if (!simbokCanManageRPD(master)) {
        return;
      }

      simbokOpenRPDModal(master);
    }
  );

  /* Kontrol buka/tutup modal RPD. */
  simbokAddHandler(
    document.getElementById("simbokCloseRpdModal"),
    "click",
    simbokCloseRPDModal
  );

  simbokAddHandler(
    document.getElementById("simbokCancelRpdModal"),
    "click",
    simbokCloseRPDModal
  );

  simbokAddHandler(
    document.getElementById("simbokRpdModal"),
    "click",
    event => {
      if (event.target.id === "simbokRpdModal") {
        simbokCloseRPDModal();
      }
    }
  );

  
/* ======================================================
   EVENT LISTENER RPD — PANEL BULANAN
====================================================== */

// 1. Buka / tutup panel bulan.
simbokAddHandler(
  document.getElementById("simbokRpdMonthlyList"),
  "click",
  event => {
    const button = event.target.closest("[data-rpd-month-toggle]");
    if (!button) return;

    const month = button.dataset.rpdMonthToggle;

    simbokRpdOpenMonth =
      simbokRpdOpenMonth === month ? "" : month;

    simbokRenderRPDMonthlyList();
  }
);


// 2. Pilih / batalkan komponen untuk bulan tertentu.
simbokAddHandler(
  document.getElementById("simbokRpdMonthlyList"),
  "change",
  event => {
    const checkbox = event.target.closest(
      "[data-rpd-month-component]"
    );

    if (!checkbox) return;

    const key = checkbox.dataset.rpdMonthComponent;
    const month = checkbox.dataset.rpdMonthName;

    const component = simbokRpdDraftComponents.find(item =>
      String(item.key) === String(key)
    );

    if (!component) return;

    const data = component.bulan[month];

    if (!data || data.locked) {
      checkbox.checked = data?.digunakan === true;
      return;
    }

    data.digunakan = checkbox.checked;

    simbokRenderRPDMonthlyList();
    simbokUpdateRPDSummary();
  }
);


// 3. Perubahan jumlah lokasi, frekuensi, dan harga satuan.
simbokAddHandler(
  document.getElementById("simbokRpdMonthlyList"),
  "input",
  event => {
    const input = event.target.closest("[data-rpd-field]");
    if (!input) return;

    const component = simbokRpdDraftComponents.find(item =>
      String(item.key) === String(input.dataset.rpdKey)
    );

    if (!component) return;

    const month = input.dataset.rpdMonth;
    const field = input.dataset.rpdField;
    const data = component.bulan[month];

    if (!data || data.locked) return;

    if (!["jumlahLokasi", "frekuensi", "hargaSatuan"].includes(field)) {
      return;
    }

    data[field] = Math.max(0, Number(input.value || 0));

    simbokUpdateRPDSummary();

    // Perbarui total komponen tanpa menutup panel bulan.
    const total = simbokCalculateRPDMonthComponent(
      component,
      month
    );

    const detail = input.closest(".simbok-rpd-month-detail-card");

    const totalInput = detail?.querySelector(
      '[data-rpd-field="totalAnggaran"]'
    );

    if (totalInput) {
      totalInput.value = simbokCurrency(total);
    }
  }
);


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
    await simbokLoadMasters();

    simbokInitPlanning();

  } catch (error) {
    console.error("[simBOK] Gagal memuat master Firestore:", error);

    window.alert(
      "Data master simBOK gagal dimuat dari Firestore. " +
      "Periksa koneksi dan izin akses."
    );
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




































