/* ======================================================
   SMART OFFICE — ARSIP PEGAWAI FIRESTORE SERVICE
====================================================== */

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";

import {
    smartofficeGetDokumenPegawaiFirestore
} from "./dokumen-saya-firestore.service.js";


/* ======================================================
   GET DAFTAR PEGAWAI ARSIP
====================================================== */
export async function smartofficeGetDaftarPegawaiArsipFirestore(){

    const snapshot = await getDocs(
        collection(
            smartofficeFirestore,
            "pegawai"
        )
    );

    const result = [];

    snapshot.forEach((docSnapshot) => {

        const data = docSnapshot.data();

        if(String(data.status || "").trim() !== "AKTIF"){
            return;
        }

        if(!data.nama){
            return;
        }

        result.push({
            nama: data.nama,
            nip: docSnapshot.id,
            statusKepegawaian:
                data.statusKepegawaian || ""
        });
    });

    result.sort((a,b) =>
        String(a.nama).localeCompare(
            String(b.nama)
        )
    );

    return result;
}


/* ======================================================
   GET ARSIP PEGAWAI
====================================================== */
export async function smartofficeGetArsipPegawaiFirestore(
    nip
){

    const nipValue = String(nip || "").trim();

    if(!nipValue){
        throw new Error(
            "NIP tidak boleh kosong."
        );
    }

    /* -----------------------------------------------
       DATA PEGAWAI
    ------------------------------------------------ */
    const pegawaiSnapshot = await getDoc(
        doc(
            smartofficeFirestore,
            "pegawai",
            nipValue
        )
    );

    if(!pegawaiSnapshot.exists()){
        throw new Error(
            "Data pegawai tidak ditemukan."
        );
    }

    const pegawaiData =
        pegawaiSnapshot.data();

    /* -----------------------------------------------
       DATA ARSIP
       Gunakan service yang sudah melakukan
       merge MASTER_DOKUMEN + DOKUMEN_PEGAWAI
    ------------------------------------------------ */
    const dokumen =
        await smartofficeGetDokumenPegawaiFirestore(
            nipValue
        );

    return {
        pegawai: {
            ...pegawaiData,
            nip:
                pegawaiData.nip ||
                nipValue
        },

        dokumen:
            dokumen || []
    };
}


/* ======================================================
   GET ARSIP STAT
====================================================== */
export async function smartofficeGetArsipStatFirestore(){

    const [
        pegawaiSnapshot,
        dokumenSnapshot
    ] = await Promise.all([

        getDocs(
            collection(
                smartofficeFirestore,
                "pegawai"
            )
        ),

        getDocs(
            collection(
                smartofficeFirestore,
                "dokumenPegawai"
            )
        )

    ]);

    let totalPegawai = 0;
    let totalUpload = 0;
    let totalTerverifikasi = 0;

    /* -----------------------------------------------
       PEGAWAI AKTIF
    ------------------------------------------------ */
    pegawaiSnapshot.forEach((docSnapshot) => {

        const data = docSnapshot.data();

        if(
            String(data.status || "").trim() ===
            "AKTIF"
        ){
            totalPegawai++;
        }
    });

    /* -----------------------------------------------
       DOKUMEN
    ------------------------------------------------ */
    dokumenSnapshot.forEach((docSnapshot) => {

        const data = docSnapshot.data();

        totalUpload++;

        if(
            String(data.statusVerifikasi || "").trim() ===
            "TERVERIFIKASI"
        ){
            totalTerverifikasi++;
        }
    });

    return {
        totalPegawai,
        totalUpload,
        totalTerverifikasi
    };
}


/* ======================================================
   GET PROGRESS ARSIP
   MIRROR DARI smartofficeGetProgressArsipFast()
====================================================== */
export async function smartofficeGetProgressArsipFirestore(){

    const [
        pegawaiSnapshot,
        masterSnapshot,
        dokumenSnapshot
    ] = await Promise.all([

        getDocs(
            collection(
                smartofficeFirestore,
                "pegawai"
            )
        ),

        getDocs(
            collection(
                smartofficeFirestore,
                "masterDokumen"
            )
        ),

        getDocs(
            collection(
                smartofficeFirestore,
                "dokumenPegawai"
            )
        )

    ]);

    const masterData = [];

    masterSnapshot.forEach((docSnapshot) => {

        masterData.push(
            docSnapshot.data()
        );

    });

    const dokumenData = [];

    dokumenSnapshot.forEach((docSnapshot) => {

        dokumenData.push(
            docSnapshot.data()
        );

    });

    const result = [];

    /* -----------------------------------------------
       LOOP PEGAWAI AKTIF
    ------------------------------------------------ */
    pegawaiSnapshot.forEach((docSnapshot) => {

        const pegawai =
            docSnapshot.data();

        if(
            String(pegawai.status || "").trim() !==
            "AKTIF"
        ){
            return;
        }

        const nama =
            pegawai.nama || "";

        const nip =
            pegawai.nip || docSnapshot.id;

        const statusKepegawaian =
            String(
                pegawai.statusKepegawaian || ""
            ).trim();

        const jenisPegawai =
            String(
                pegawai.jenisPegawai || ""
            ).trim();

        /* -------------------------------------------
           TMT
        -------------------------------------------- */
        const tahunTmtAwal =
            smartofficeGetYear(
                pegawai.tmtAwal
            );

        const tahunTmtPertama =
            smartofficeGetYear(
                pegawai.tmtPertama
            );

        const tahunAkhirBlud =
            Number(
                pegawai.tahunAkhirBlud || 0
            );

        /* -------------------------------------------
           RIWAYAT PENDIDIKAN
        -------------------------------------------- */
        const riwayatPendidikan =
            String(
                pegawai.riwayatPendidikan || ""
            )
            .toUpperCase()
            .split(",")
            .map(item => item.trim());

        /* -------------------------------------------
            TOTAL DOKUMEN WAJIB
            Simpan kode dokumen yang eligible
            agar verified hanya menghitung dokumen
            yang benar-benar wajib untuk pegawai ini.
        -------------------------------------------- */
        let total = 0;

        const kodeDokumenWajib = new Set();

        /* -------------------------------------------
           HITUNG MASTER WAJIB
        -------------------------------------------- */
        for(const row of masterData){

            if(
                String(
                    row.statusAktif || ""
                ).trim() !== "AKTIF"
            ){
                continue;
            }

            if(
                String(
                    row.wajibUpload || ""
                ).trim() !== "YA"
            ){
                continue;
            }

            const targetStatus =
                String(
                    row.targetStatus || "ALL"
                ).trim();

            const targetJenis =
                String(
                    row.targetJenis || "ALL"
                ).trim();

            const filterPendidikan =
                String(
                    row.filterPendidikan || "ALL"
                )
                .trim()
                .toUpperCase();

            /* ---------------------------------------
               FILTER TAHUN DOKUMEN
            ---------------------------------------- */
            const tahunDokumen =
                Number(
                    row.tahunDokumen || 0
                );

            let cocokTahun = true;

            if(tahunDokumen > 0){

                if(targetStatus === "BLUD"){

                    const tahunMulai =
                        tahunTmtPertama > 0
                            ? tahunTmtPertama
                            : tahunTmtAwal;

                    const tahunSelesai =
                        tahunAkhirBlud > 0
                            ? tahunAkhirBlud
                            : new Date().getFullYear();

                    cocokTahun =
                        tahunDokumen >= tahunMulai &&
                        tahunDokumen <= tahunSelesai;

                }else{

                    cocokTahun =
                        tahunDokumen >= tahunTmtAwal;

                }
            }

            /* ---------------------------------------
               STATUS PEGAWAI
            ---------------------------------------- */
            const statusPegawai =
                [statusKepegawaian];

            if(tahunTmtPertama > 0){
                statusPegawai.push("BLUD");
            }

            const cocokStatus =
                targetStatus === "ALL" ||
                statusPegawai.includes(
                    targetStatus
                );

            const cocokJenis =
                targetJenis === "ALL" ||
                targetJenis === jenisPegawai;

            const cocokPendidikan =
                filterPendidikan === "ALL" ||
                riwayatPendidikan.includes(
                    filterPendidikan
                );

            /* ---------------------------------------
               DOKUMEN WAJIB YANG COCOK
            ---------------------------------------- */
            if(
                cocokStatus &&
                cocokJenis &&
                cocokPendidikan &&
                cocokTahun
            ){
                total++;

                /* Simpan kode dokumen wajib
                yang eligible untuk pegawai ini */
                kodeDokumenWajib.add(
                    String(
                        row.kodeDokumen || ""
                    ).trim()
                );
            }
        }

        /* -------------------------------------------
           HITUNG DOKUMEN TERVERIFIKASI
           HANYA dokumen wajib yang eligible
           untuk pegawai ini yang dihitung.
        -------------------------------------------- */
        let verified = 0;

        for(const row of dokumenData){

            /* Hanya dokumen milik pegawai ini */
            if(
                String(row.nip || "").trim() !==
                String(nip).trim()
            ){
                continue;
            }

            /* Harus sudah terverifikasi */
            if(
                String(
                    row.statusVerifikasi || ""
                ).trim() !== "TERVERIFIKASI"
            ){
                continue;
            }

            /* Ambil kode dokumen */
            const kodeDokumen =
                String(
                    row.kodeDokumen || ""
                ).trim();

            /* Hanya hitung jika kode tersebut
            termasuk dokumen WAJIB yang
            eligible untuk pegawai ini */
            if(
                kodeDokumenWajib.has(
                    kodeDokumen
                )
            ){
                verified++;
            }
        }

        /* -------------------------------------------
           PROGRESS
        -------------------------------------------- */
        const progress =
            total > 0
                ? Math.round(
                    (verified / total) * 100
                )
                : 0;

        /* -------------------------------------------
           INISIAL
        -------------------------------------------- */
        const namaParts =
            String(nama)
                .trim()
                .split(" ")
                .filter(Boolean);

        const inisial =
            namaParts.length >= 2
                ? (
                    namaParts[0][0] +
                    namaParts[1][0]
                )
                : (
                    namaParts[0]?.[0] || ""
                );

        result.push({
            nama,
            inisial: inisial.toUpperCase(),
            jabatan: pegawai.jabatan || "",
            nip,
            total,
            verified,
            progress
        });

    });

    /* -----------------------------------------------
       SORT PROGRESS TERBESAR → TERKECIL
    ------------------------------------------------ */
    result.sort(
        (a,b) =>
            b.progress - a.progress
    );

    return result;
}


/* ======================================================
   HELPER — AMBIL TAHUN
====================================================== */
function smartofficeGetYear(value){

    if(!value){
        return 0;
    }

    if(typeof value === "number"){
        return value;
    }

    const date =
        new Date(value);

    if(
        Number.isNaN(
            date.getTime()
        )
    ){
        return 0;
    }

    return date.getFullYear();
}