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

   LOGIKA ELIGIBILITY SAMA DENGAN DOKUMEN SAYA
   TETAPI BERDIRI SENDIRI DI MODUL ARSIP.

   SUMBER DATA:
   - pegawai
   - masterDokumen
   - dokumenPegawai
====================================================== */
export async function smartofficeGetProgressArsipFirestore(){

    try{

        /* ==================================================
           AMBIL DATA FIRESTORE
        ================================================== */

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


        /* ==================================================
           MASTER DOKUMEN
        ================================================== */

        const masterData = [];

        masterSnapshot.forEach(
            docSnapshot => {

                masterData.push(
                    docSnapshot.data()
                );

            }
        );


        /* ==================================================
           DOKUMEN PEGAWAI
        ================================================== */

        const dokumenData = [];

        dokumenSnapshot.forEach(
            docSnapshot => {

                dokumenData.push(
                    docSnapshot.data()
                );

            }
        );


        /* ==================================================
           HASIL
        ================================================== */

        const result = [];


        /* ==================================================
           URUTAN GOLONGAN
        ================================================== */

        const URUTAN_GOLONGAN = [

            "I/a",
            "I/b",
            "I/c",
            "I/d",

            "II/a",
            "II/b",
            "II/c",
            "II/d",

            "III/a",
            "III/b",
            "III/c",
            "III/d",

            "IV/a",
            "IV/b",
            "IV/c",
            "IV/d"

        ];


        /* ==================================================
           NORMALISASI GOLONGAN

           HANYA UNTUK PERBANDINGAN.

           TAMPILAN TETAP:
           III/c
           II/d
           IV/a
        ================================================== */

        function normalisasiGolongan(value){

            return String(
                value || ""
            )
                .trim()
                .replace(
                    /\s+/g,
                    ""
                )
                .replace(
                    /([IV]+)\/?([A-Da-d])/i,
                    (
                        _,
                        romawi,
                        huruf
                    ) =>
                        `${romawi.toUpperCase()}/${huruf.toLowerCase()}`
                );

        }


        /* ==================================================
           LOOP PEGAWAI AKTIF
        ================================================== */

        pegawaiSnapshot.forEach(
            docSnapshot => {

                const pegawai =
                    docSnapshot.data();


                /* ==========================================
                   HANYA PEGAWAI AKTIF
                ========================================== */

                if(
                    String(
                        pegawai.status || ""
                    )
                    .trim()
                    .toUpperCase() !==
                    "AKTIF"
                ){
                    return;
                }


                /* ==========================================
                   IDENTITAS
                ========================================== */

                const nama =
                    String(
                        pegawai.nama || ""
                    ).trim();

                const nip =
                    String(
                        pegawai.nip ||
                        docSnapshot.id ||
                        ""
                    ).trim();


                if(
                    !nama ||
                    !nip
                ){
                    return;
                }


                /* ==========================================
                   DATA KEPEGAWAIAN
                ========================================== */

                const statusKepegawaian =
                    String(
                        pegawai.statusKepegawaian || ""
                    )
                    .trim()
                    .toUpperCase();


                const jenisPegawai =
                    String(
                        pegawai.jenisPegawai || ""
                    )
                    .trim()
                    .toUpperCase();


                /* ==========================================
                   TMT
                ========================================== */

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


                /* ==========================================
                   RIWAYAT PENDIDIKAN

                   CONTOH:
                   SD,SMP,SMA,S1/D4,S2
                ========================================== */

                const riwayatPendidikan =
                    String(
                        pegawai.riwayatPendidikan || ""
                    )
                    .toUpperCase()
                    .split(/[;,]/)
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(Boolean);


                /* ==========================================
                   GOLONGAN PERTAMA
                ========================================== */

                const golonganPertama =
                    normalisasiGolongan(
                        pegawai.golonganPertama
                    );


                /* ==========================================
                   GOLONGAN SEKARANG

                   Bisa:
                   III/c

                   atau:
                   Penata / IIIc
                ========================================== */

                const pangkatGolonganRaw =
                    String(
                        pegawai.pangkatGolongan || ""
                    ).trim();


                const matchGolongan =
                    pangkatGolonganRaw.match(
                        /(I{1,3}|IV)\/?([A-Da-d])\b/i
                    );


                const golonganSekarang =
                    matchGolongan
                        ? normalisasiGolongan(
                            `${matchGolongan[1]}/${matchGolongan[2]}`
                        )
                        : normalisasiGolongan(
                            pangkatGolonganRaw
                        );


                /* ==========================================
                   RIWAYAT GOLONGAN

                   GOLONGAN PERTAMA TIDAK DIHITUNG
                   karena sudah dicakup SK CPNS.

                   Contoh:

                   Pertama : II/c
                   Sekarang: III/c

                   Hasil:
                   II/d
                   III/a
                   III/b
                   III/c
                ========================================== */

                let riwayatGolongan = [];


                const indexAwal =
                    URUTAN_GOLONGAN.findIndex(
                        item =>
                            normalisasiGolongan(item) ===
                            golonganPertama
                    );


                const indexAkhir =
                    URUTAN_GOLONGAN.findIndex(
                        item =>
                            normalisasiGolongan(item) ===
                            golonganSekarang
                    );


                if(
                    indexAwal >= 0 &&
                    indexAkhir >= 0 &&
                    indexAkhir > indexAwal
                ){

                    riwayatGolongan =
                        URUTAN_GOLONGAN.slice(
                            indexAwal + 1,
                            indexAkhir + 1
                        );

                }


                /* ==========================================
                   RIWAYAT JENJANG JABATAN

                   CONTOH:
                   Terampil;Mahir;Penyelia
                ========================================== */

                const riwayatJenjangJabatan =
                    String(
                        pegawai.jenjangJabatan || ""
                    )
                    .toUpperCase()
                    .split(/[;,]/)
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(Boolean);


                /* ==================================================
                   SET DOKUMEN WAJIB

                   PENTING:
                   SATU KODE DOKUMEN = SATU KELENGKAPAN

                   Jadi MULTI_UPLOAD tidak menggandakan progress.
                ================================================== */

                const kodeDokumenWajib =
                    new Set();


                /* ==================================================
                   LOOP MASTER DOKUMEN
                ================================================== */

                for(
                    const row of masterData
                ){

                    /* ==============================================
                       STATUS AKTIF
                    ============================================== */

                    if(
                        String(
                            row.statusAktif || ""
                        )
                        .trim()
                        .toUpperCase() !==
                        "AKTIF"
                    ){
                        continue;
                    }


                    /* ==============================================
                       WAJIB UPLOAD
                    ============================================== */

                    if(
                        String(
                            row.wajibUpload || ""
                        )
                        .trim()
                        .toUpperCase() !==
                        "YA"
                    ){
                        continue;
                    }


                    /* ==============================================
                       KODE DOKUMEN
                    ============================================== */

                    const kodeDokumen =
                        String(
                            row.kodeDokumen || ""
                        ).trim();


                    if(!kodeDokumen){
                        continue;
                    }


                    /* ==============================================
                       TARGET STATUS

                       Bisa:
                       PNS
                       BLUD
                       PNS;BLUD
                       ALL
                    ============================================== */

                    const targetStatusList =
                        String(
                            row.targetStatus || "ALL"
                        )
                        .split(/[;,]/)
                        .map(
                            item =>
                                item
                                    .trim()
                                    .toUpperCase()
                        )
                        .filter(Boolean);


                    const statusPegawai = [
                        statusKepegawaian
                    ];


                    /* ==============================================
                       PEGAWAI DENGAN TMT PERTAMA
                       MENDAPAT STATUS BLUD
                    ============================================== */

                    if(
                        tahunTmtPertama > 0
                    ){

                        statusPegawai.push(
                            "BLUD"
                        );

                    }


                    const cocokStatus =
                        targetStatusList.length === 0 ||
                        targetStatusList.includes("ALL") ||
                        targetStatusList.some(
                            status =>
                                statusPegawai.includes(
                                    status
                                )
                        );


                    if(!cocokStatus){
                        continue;
                    }


                    /* ==============================================
                       TARGET JENIS
                    ============================================== */

                    const targetJenisList =
                        String(
                            row.targetJenis || "ALL"
                        )
                        .split(/[;,]/)
                        .map(
                            item =>
                                item
                                    .trim()
                                    .toUpperCase()
                        )
                        .filter(Boolean);


                    const cocokJenis =
                        targetJenisList.length === 0 ||
                        targetJenisList.includes("ALL") ||
                        targetJenisList.includes(
                            jenisPegawai
                        );


                    if(!cocokJenis){
                        continue;
                    }


                    /* ==============================================
                       FILTER PENDIDIKAN
                    ============================================== */

                    const filterPendidikanList =
                        String(
                            row.filterPendidikan || "ALL"
                        )
                        .split(/[;,]/)
                        .map(
                            item =>
                                item
                                    .trim()
                                    .toUpperCase()
                        )
                        .filter(Boolean);


                    const cocokPendidikan =
                        filterPendidikanList.length === 0 ||
                        filterPendidikanList.includes("ALL") ||
                        filterPendidikanList.some(
                            pendidikan =>
                                riwayatPendidikan.includes(
                                    pendidikan
                                )
                        );


                    if(!cocokPendidikan){
                        continue;
                    }


                    /* ==============================================
                       TAHUN DOKUMEN
                    ============================================== */

                    const tahunDokumen =
                        Number(
                            row.tahunDokumen || 0
                        );


                    let cocokTahun = true;


                    if(
                        tahunDokumen > 0
                    ){

                        const targetStatus =
                            String(
                                row.targetStatus || ""
                            )
                            .trim()
                            .toUpperCase();


                        if(
                            targetStatus ===
                            "BLUD"
                        ){

                            const tahunMulai =
                                tahunTmtPertama > 0
                                    ? tahunTmtPertama
                                    : tahunTmtAwal;


                            const tahunSelesai =
                                tahunAkhirBlud > 0
                                    ? tahunAkhirBlud
                                    : new Date()
                                        .getFullYear();


                            cocokTahun =
                                tahunDokumen >=
                                    tahunMulai &&
                                tahunDokumen <=
                                    tahunSelesai;

                        }
                        else{

                            cocokTahun =
                                tahunDokumen >=
                                tahunTmtAwal;

                        }

                    }


                    if(!cocokTahun){
                        continue;
                    }


                    /* ==============================================
                       PANGKAT / GOLONGAN
                    ============================================== */

                    const masterGolongan =
                        String(
                            row.pangkatGolongan || ""
                        )
                        .split(/[;,]/)
                        .map(
                            item =>
                                normalisasiGolongan(
                                    item
                                )
                        )
                        .filter(Boolean);


                    let cocokGolongan = true;


                    if(
                        masterGolongan.length > 0 &&
                        !masterGolongan.includes("ALL")
                    ){

                        cocokGolongan =
                            masterGolongan.some(
                                golongan =>
                                    riwayatGolongan.includes(
                                        golongan
                                    )
                            );

                    }


                    if(!cocokGolongan){
                        continue;
                    }


                    /* ==============================================
                       JENJANG JABATAN
                    ============================================== */

                    const masterJenjangJabatan =
                        String(
                            row.jenjangJabatan || ""
                        )
                        .toUpperCase()
                        .split(/[;,]/)
                        .map(
                            item =>
                                item.trim()
                        )
                        .filter(Boolean);


                    let cocokJenjangJabatan =
                        true;


                    if(
                        masterJenjangJabatan.length > 0 &&
                        !masterJenjangJabatan.includes("ALL")
                    ){

                        cocokJenjangJabatan =
                            masterJenjangJabatan.some(
                                jenjang =>
                                    riwayatJenjangJabatan.includes(
                                        jenjang
                                    )
                            );

                    }


                    if(!cocokJenjangJabatan){
                        continue;
                    }


                    /* ==============================================
                       SEMUA FILTER LOLOS

                       MASUK SEBAGAI DOKUMEN WAJIB
                    ============================================== */

                    kodeDokumenWajib.add(
                        kodeDokumen
                    );

                }


                /* ==================================================
                   TOTAL DOKUMEN WAJIB
                ================================================== */

                const total =
                    kodeDokumenWajib.size;


                /* ==================================================
                   DOKUMEN TERVERIFIKASI

                   MENGGUNAKAN SET AGAR:

                   - MULTI UPLOAD TIDAK MENGGANDakan
                   - SATU KODE = SATU KELENGKAPAN
                ================================================== */

                const kodeDokumenVerified =
                    new Set();


                for(
                    const row of dokumenData
                ){

                    /* ==============================================
                       HARUS MILIK PEGAWAI
                    ============================================== */

                    if(
                        String(
                            row.nip || ""
                        ).trim() !==
                        nip
                    ){
                        continue;
                    }


                    /* ==============================================
                       HARUS TERVERIFIKASI
                    ============================================== */

                    if(
                        String(
                            row.statusVerifikasi || ""
                        )
                        .trim()
                        .toUpperCase() !==
                        "TERVERIFIKASI"
                    ){
                        continue;
                    }


                    const kodeDokumen =
                        String(
                            row.kodeDokumen || ""
                        ).trim();


                    /* ==============================================
                       HARUS TERMASUK DOKUMEN WAJIB
                    ============================================== */

                    if(
                        !kodeDokumenWajib.has(
                            kodeDokumen
                        )
                    ){
                        continue;
                    }


                    kodeDokumenVerified.add(
                        kodeDokumen
                    );

                }


                /* ==================================================
                   VERIFIED
                ================================================== */

                const verified =
                    kodeDokumenVerified.size;


                /* ==================================================
                   PROGRESS
                ================================================== */

                const progress =
                    total > 0
                        ? Math.round(
                            (
                                verified /
                                total
                            ) * 100
                        )
                        : 0;


                /* ==================================================
                   INISIAL
                ================================================== */

                const namaParts =
                    nama
                        .split(" ")
                        .filter(Boolean);


                const inisial =
                    namaParts.length >= 2
                        ? (
                            namaParts[0][0] +
                            namaParts[1][0]
                        )
                        : (
                            namaParts[0]?.[0] ||
                            ""
                        );


                /* ==================================================
                   PUSH HASIL
                ================================================== */

                result.push({

                    nama,

                    inisial:
                        inisial.toUpperCase(),

                    jabatan:
                        pegawai.jabatan || "",

                    nip,

                    total,

                    verified,

                    progress

                });

            }
        );


        /* ==================================================
           SORT
           PROGRESS TERBESAR → TERKECIL
        ================================================== */

        result.sort(
            (a,b) =>
                b.progress -
                a.progress
        );


        return result;

    }
    catch(error){

        console.error(
            "Firestore Get Progress Arsip Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal mengambil progress arsip."
        );

    }

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