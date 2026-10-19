/* ==========================================================
   SMART OFFICE — SERVICE TEMPLATE DOKUMEN
   Frontend -> smartofficeApi() -> GAS -> Spreadsheet/Drive
========================================================== */
import { smartofficeApi } from "../core/api.js";


/* ==========================================================
   TEMPLATE DOKUMEN — GET DATA
   Fungsi: smartofficeGetTemplateDokumen
   Tujuan:
   1. Mengambil daftar template dokumen dari backend GAS.
   2. Mendukung filter berdasarkan kategori.
========================================================== */
export async function smartofficeGetTemplateDokumen(kategori = "") {
  const response = await smartofficeApi(
    "smartofficeGetTemplateDokumen",
    { kategori }
  );

  if (!response?.success) {
    throw new Error(
      response?.message || "Gagal memuat Template Dokumen."
    );
  }

  return response.data || [];
}


/* ==========================================================
   TEMPLATE DOKUMEN — SIMPAN / EDIT
   Fungsi: smartofficeSimpanTemplateDokumen
   Tujuan:
   1. Menyimpan template dokumen baru.
   2. Memperbarui metadata template yang sudah ada.
   3. Mengirim file dalam format JSON ke backend GAS.
========================================================== */
export async function smartofficeSimpanTemplateDokumen(payload = {}) {
  const request = { ...payload };

  if (payload.file && typeof payload.file === "object") {
    request.file = JSON.stringify(payload.file);
  } else {
    request.file = "";
  }

  const response = await smartofficeApi(
    "smartofficeSimpanTemplateDokumen",
    request
  );

  if (!response?.success) {
    throw new Error(
      response?.message || "Gagal menyimpan Template Dokumen."
    );
  }

  return response.data || {};
}


/* ==========================================================
   TEMPLATE DOKUMEN — UPDATE STATUS
   Fungsi: smartofficeUpdateStatusTemplateDokumen
   Tujuan:
   1. Mengubah status template menjadi Aktif atau Nonaktif.
   2. Mengirim ID template dan identitas aktor ke backend GAS.
========================================================== */
export async function smartofficeUpdateStatusTemplateDokumen(payload = {}) {
  const response = await smartofficeApi(
    "smartofficeUpdateStatusTemplateDokumen",
    {
      idTemplate: payload.idTemplate || "",
      status: payload.status || "",
      diperbaruiOleh: payload.diperbaruiOleh || ""
    }
  );

  if (!response?.success) {
    throw new Error(
      response?.message || "Gagal mengubah status Template Dokumen."
    );
  }

  return response.data || {};
}


/* ==========================================================
   TEMPLATE DOKUMEN — HAPUS
   Fungsi: smartofficeHapusTemplateDokumen
   Tujuan:
   1. Menghapus metadata template berdasarkan ID_TEMPLATE.
   2. Meminta backend menangani file terkait di Google Drive.
   Hak akses: SUPERADMIN harus divalidasi di backend GAS.
========================================================== */
export async function smartofficeHapusTemplateDokumen(payload = {}) {
  const response = await smartofficeApi(
    "smartofficeHapusTemplateDokumen",
    {
      idTemplate: payload.idTemplate || "",
      diperbaruiOleh: payload.diperbaruiOleh || ""
    }
  );

  if (!response?.success) {
    throw new Error(
      response?.message || "Gagal menghapus Template Dokumen."
    );
  }

  return response.data || {};
}


/* ==========================================================
   TEMPLATE DOKUMEN — LOCK / UNLOCK
   Fungsi: smartofficeSetLockTemplateDokumen
   Tujuan:
   1. Mengunci atau membuka kunci template dokumen.
   2. Mengirim ID_TEMPLATE, IS_LOCK, dan NIP aktor ke backend GAS.
   3. Memeriksa respons API dan menangani error.
   Hak akses: SUPERADMIN harus divalidasi di backend GAS.
   Action GAS: smartofficeSetLockTemplateDokumen
========================================================== */
export async function smartofficeSetLockTemplateDokumen(payload = {}) {
  const response = await smartofficeApi(
    "smartofficeSetLockTemplateDokumen",
    {
      idTemplate: payload.idTemplate || "",
      isLock: payload.isLock === true ? "true" : "false",
      diperbaruiOleh: payload.diperbaruiOleh || ""
    }
  );

  if (!response?.success) {
    throw new Error(
      response?.message ||
      "Gagal mengubah status Lock Template Dokumen."
    );
  }

  const result = response.data || {};

  if (result.success === false) {
    throw new Error(
      result.message ||
      "Gagal mengubah status Lock Template Dokumen."
    );
  }

  return result;
}

