/* ======================================================
   SMART OFFICE — ARSIP PEGAWAI SERVICE
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";


/* ======================================================
   GET DAFTAR PEGAWAI ARSIP
====================================================== */
export async function smartofficeGetDaftarPegawaiArsip(){
    const result =
        await smartofficeApi(
            "smartofficeGetDaftarPegawaiArsip"
        );

    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal memuat daftar pegawai."
        );
    }

    return result.data || [];
}


/* ======================================================
   GET ARSIP PEGAWAI
====================================================== */
export async function smartofficeGetArsipPegawai(
    nip
){
    const result =
        await smartofficeApi(
            "smartofficeGetArsipPegawai",
            {
                nip
            }
        );

    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal memuat arsip pegawai."
        );
    }

    return result.data || {};
}


/* ======================================================
   GET ARSIP STAT
====================================================== */
export async function smartofficeGetArsipStat(){
    const result =
        await smartofficeApi(
            "smartofficeGetArsipStat"
        );

    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal memuat statistik arsip."
        );
    }

    return result.data || {};
}


/* ======================================================
   GET PROGRESS ARSIP
====================================================== */
export async function smartofficeGetProgressArsip(){
    const result =
        await smartofficeApi(
            "smartofficeGetProgressArsipFast"
        );

    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal memuat progress arsip."
        );
    }

    return result.data || [];
}


/* ======================================================
   BUKA LOCK DOKUMEN
====================================================== */
export async function smartofficeBukaLockDokumen(
    idDokumen,
    alasan,
    nip,
    role
){
    const result =
        await smartofficeApi(
            "smartofficeBukaLockDokumen",
            {
                idDokumen,
                alasan,
                nip,
                role
            }
        );

    if(!result.success){
        throw new Error(
            result.message ||
            "Gagal membuka lock dokumen."
        );
    }

    return result;
}