
/* ==========================================================
   SMART OFFICE — SERVICE ARSIP PUSKESMAS
   Backend: Google Apps Script
   READ/WRITE: GAS terlebih dahulu
   Firestore mirror: belum ditambahkan
========================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ==========================================================
   AMBIL DATA ARSIP PUSKESMAS
========================================================== */
export async function smartofficeGetArsipPuskesmas(
    kategori = ""
){
    return await smartofficeApi(
        "smartofficeGetArsipPuskesmas",
        {
            kategori: kategori
        }
    );
}


/* ==========================================================
   SIMPAN / TAMBAH / EDIT ARSIP PUSKESMAS
========================================================== */
export async function smartofficeSimpanArsipPuskesmas(
    payload = {}
){
    const data = {
        idArsip: payload.idArsip || "",
        kategori: payload.kategori || "",
        tahunDokumen: payload.tahunDokumen || "",
        namaArsip: payload.namaArsip || "",
        keterangan: payload.keterangan || "",
        statusArsip: payload.statusArsip || "Aktif",
        diperbaruiOleh: payload.diperbaruiOleh || ""
    };

    /*
     * Backend GAS menerima file sebagai JSON string:
     * { name, type, data }
     *
     * data berisi Base64 tanpa prefix data URL.
     */
    if(payload.file){
        data.file = JSON.stringify({
            name: payload.file.name,
            type: payload.file.type,
            data: payload.file.data
        });
    }

    return await smartofficeApi(
        "smartofficeSimpanArsipPuskesmas",
        data
    );
}


/* ==========================================================
   UBAH STATUS ARSIP
========================================================== */
export async function smartofficeUpdateStatusArsipPuskesmas(
    payload = {}
){
    return await smartofficeApi(
        "smartofficeUpdateStatusArsipPuskesmas",
        {
            idArsip: payload.idArsip || "",
            statusArsip: payload.statusArsip || "",
            diperbaruiOleh: payload.diperbaruiOleh || ""
        }
    );
}


/* ==========================================================
   KUNCI / BUKA KUNCI ARSIP PUSKESMAS
========================================================== */
export async function smartofficeSetLockArsipPuskesmas(
    payload = {}
) {
    return await smartofficeApi(
        "smartofficeSetLockArsipPuskesmas",
        {
            idArsip: payload.idArsip || "",
            isLock: payload.isLock === true,
            diperbaruiOleh: payload.diperbaruiOleh || ""
        }
    );
}


/* ==========================================================
   HAPUS ARSIP PUSKESMAS
   Backend: Google Apps Script
   Hak akses: SUPERADMIN divalidasi backend
========================================================== */
export async function smartofficeHapusArsipPuskesmas(
    payload = {}
) {
    const idArsip = String(payload.idArsip || "").trim();

    if (!idArsip) {
        throw new Error("ID arsip wajib diisi.");
    }

    const response = await smartofficeApi(
        "smartofficeHapusArsipPuskesmas",
        {
            idArsip,
            diperbaruiOleh: payload.diperbaruiOleh || ""
        }
    );

    if (!response?.success) {
        throw new Error(
            response?.message || "Gagal menghapus arsip."
        );
    }

    return response;
}
