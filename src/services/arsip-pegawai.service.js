/* ======================================================
   SMART OFFICE — ARSIP PEGAWAI SERVICE
====================================================== */
import {
    smartofficeApi
} from "../core/api.js";

import {
    smartofficeGetDaftarPegawaiArsipFirestore,
    smartofficeGetArsipPegawaiFirestore,
    smartofficeGetArsipStatFirestore,
    smartofficeGetProgressArsipFirestore
} from "./arsip-pegawai-firestore.service.js";

import {
    smartofficeGetDokumenPegawaiFirestore
} from "./dokumen-saya-firestore.service.js";


/* ======================================================
   GET DAFTAR PEGAWAI ARSIP
   FIRESTORE READ
====================================================== */
export async function smartofficeGetDaftarPegawaiArsip(){

    try{
        return await smartofficeGetDaftarPegawaiArsipFirestore();
    }
    catch(error){
        console.error(
            "Firestore Daftar Pegawai Arsip Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal memuat daftar pegawai."
        );
    }
}


/* ======================================================
   GET ARSIP PEGAWAI
   FIRESTORE READ
====================================================== */
export async function smartofficeGetArsipPegawai(
    nip
){

    try{
        return await smartofficeGetArsipPegawaiFirestore(
            nip
        );
    }
    catch(error){
        console.error(
            "Firestore Arsip Pegawai Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal memuat arsip pegawai."
        );
    }
}


/* ======================================================
   GET ARSIP STAT
   FIRESTORE READ
====================================================== */
export async function smartofficeGetArsipStat(){

    try{
        return await smartofficeGetArsipStatFirestore();
    }
    catch(error){
        console.error(
            "Firestore Arsip Stat Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal memuat statistik arsip."
        );
    }
}


/* ======================================================
   GET PROGRESS ARSIP
   FIRESTORE READ
====================================================== */
export async function smartofficeGetProgressArsip(){

    try{
        return await smartofficeGetProgressArsipFirestore();
    }
    catch(error){
        console.error(
            "Firestore Progress Arsip Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal memuat progress arsip."
        );
    }
}


/* ======================================================
   BUKA LOCK DOKUMEN
   WRITE → TETAP GAS
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