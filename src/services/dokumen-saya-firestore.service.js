import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";


/* ======================================================
   GET MASTER DOKUMEN PEGAWAI
====================================================== */
export async function smartofficeGetMasterDokumenFirestore(nip){

    try{
        /* =========================
           GET PEGAWAI
        ========================= */
        const pegawaiRef =
            doc(
                smartofficeFirestore,
                "pegawai",
                String(nip || "").trim()
            );

        const pegawaiSnapshot =
            await getDoc(pegawaiRef);
        if(
            !pegawaiSnapshot.exists()
        ){
            throw new Error(
                "Data pegawai tidak ditemukan."
            );
        }

        const pegawai =
            pegawaiSnapshot.data();

        /* =========================
           DATA TAHUN
        ========================= */
        const tahunTmtPertama =
            pegawai.tmtPertama
                ? new Date(
                    pegawai.tmtPertama
                  ).getFullYear()
                : 0;

        const tahunTmtAwal =
            pegawai.tmtAwal
                ? new Date(
                    pegawai.tmtAwal
                  ).getFullYear()
                : 0;

        const tahunAkhirBlud =
            Number(
                pegawai.tahunAkhirBlud || 0
            );

        /* =========================
           STATUS PEGAWAI
        ========================= */
        const statusPegawaiSaatIni =
            String(
                pegawai.statusKepegawaian || ""
            )
            .toUpperCase()
            .trim();

        const statusPegawai =
            [
                statusPegawaiSaatIni
            ];
        if(
            tahunTmtPertama > 0
        ){
            statusPegawai.push(
                "BLUD"
            );
        }

        /* =========================
           RIWAYAT GOLONGAN OTOMATIS

           GOLONGAN PERTAMA
           DIANGGAP SUDAH ADA
           DI SK CPNS

           CONTOH:

           II/a → mulai II/b
           II/c → mulai II/d
           III/a → mulai III/b

           TAPI JIKA CURRENT GRADE
           MASIH SAMA DENGAN GOLONGAN
           PERTAMA, MAKA TIDAK ADA
           TARGET KENAIKAN.
        ========================= */
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

        /* ======================================================
           NORMALISASI GOLONGAN
        ====================================================== */
        function normalisasiGolongan(value){

            return String(value || "")
                .trim()
                .replace(/\s+/g, "")
                .replace(
                    /([IV]+)\/?([A-Da-d])/,
                    (_, romawi, huruf) =>
                        `${romawi.toUpperCase()}/${huruf.toLowerCase()}`
                );
        }

        /* ======================================================
        GOLONGAN PERTAMA
        ====================================================== */
        const golonganPertamaRaw =
            String(
                pegawai.golonganPertama || ""
            ).trim();

        const golonganPertama =
            normalisasiGolongan(
                golonganPertamaRaw
            );

        /* ======================================================
        PANGKAT / GOLONGAN SEKARANG
        ====================================================== */
        const pangkatGolonganRaw =
            String(
                pegawai.pangkatGolongan || ""
            ).trim();

        const matchGolongan =
            pangkatGolonganRaw.match(
                /\b(IV|III|II|I)\s*\/?\s*([A-D])\b/i
            );

        const golonganSekarang =
            matchGolongan
                ? normalisasiGolongan(
                    `${matchGolongan[1]}/${matchGolongan[2]}`
                )
                : normalisasiGolongan(
                    pangkatGolonganRaw
                );

        /* ======================================================
        INDEX
        ====================================================== */
        const indexAwal =
            URUTAN_GOLONGAN
                .map(g => normalisasiGolongan(g))
                .indexOf(
                    golonganPertama
                );

        const indexAkhir =
            URUTAN_GOLONGAN
                .map(g => normalisasiGolongan(g))
                .indexOf(
                    golonganSekarang
                );

        /* ======================================================
        RIWAYAT GOLONGAN
        GOLONGAN PERTAMA TIDAK DIHITUNG
        KARENA SUDAH ADA DI SK CPNS
        ====================================================== */
        let riwayatGolongan = [];

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

        /* ======================================================
        DEBUG
        ====================================================== */
        /*console.log(
            "DOKUMEN DEBUG GOLONGAN",
            {
                nip,
                pangkatGolonganRaw,
                golonganPertamaRaw,
                golonganPertama,
                golonganSekarang,
                indexAwal,
                indexAkhir,
                riwayatGolongan
            }
        );*/

        /* ======================================================
        RIWAYAT JENJANG JABATAN
        ====================================================== */
        const riwayatJenjangJabatan =
            String(
                pegawai.jenjangJabatan || ""
            )
            .toUpperCase()
            .split(/[;,]/)
            .map(
                item =>
                    item
                        .trim()
                        .replace(/\s+/g, " ")
            )
            .filter(
                Boolean
            );

        /*console.log(
            "DOKUMEN DEBUG JENJANG",
            {
                nip,
                jenjangJabatanRaw:
                    pegawai.jenjangJabatan,
                riwayatJenjangJabatan
            }
        );*/

        /* =========================
           RIWAYAT PENDIDIKAN
        ========================= */
        const riwayatPendidikan =
            String(
                pegawai.riwayatPendidikan || ""
            )
            .toUpperCase()
            .split(/[;,]/)
            .map(
                item => item.trim()
            )
            .filter(
                Boolean
            );

        /* =========================
           GET MASTER DOKUMEN
        ========================= */
        const snapshot =
            await getDocs(
                collection(
                    smartofficeFirestore,
                    "masterDokumen"
                )
            );

        /* =========================
           FILTER MASTER DOKUMEN
        ========================= */
        return snapshot.docs
            .map(
                docSnapshot => {
                    const data =
                        docSnapshot.data();

                    return {
                        kodeDokumen:
                            data.kodeDokumen || "",

                        namaDokumen:
                            data.namaDokumen || "",

                        grupDokumen:
                            data.grupDokumen || "",

                        wajibUpload:
                            data.wajibUpload || "",

                        multiUpload:
                            data.multiUpload || "",

                        targetStatus:
                            data.targetStatus || "",

                        targetJenis:
                            data.targetJenis || "",

                        statusAktif:
                            data.statusAktif || "",

                        filterPendidikan:
                            data.filterPendidikan || "",

                        tahunDokumen:
                            Number(
                                data.tahunDokumen || 0
                            ),

                        pangkatGolongan:
                            data.pangkatGolongan || "",

                        jenjangJabatan:
                            data.jenjangJabatan || ""
                    };
                }
            )
            .filter(
                item => {
                    /* =========================
                       STATUS AKTIF
                    ========================= */
                    if(
                        String(
                            item.statusAktif || ""
                        )
                        .toUpperCase()
                        .trim() !== "AKTIF"
                    ){
                        return false;
                    }

                    /* =========================
                       TARGET STATUS
                    ========================= */
                    const listStatus =
                        String(
                            item.targetStatus || ""
                        )
                        .toUpperCase()
                        .split(/[;,]/)
                        .map(
                            status =>
                                status.trim()
                        )
                        .filter(
                            Boolean
                        );

                    const cocokStatus =
                        listStatus.includes("ALL") ||
                        listStatus.some(
                            status =>
                                statusPegawai.includes(
                                    status
                                )
                        );
                    if(
                        !cocokStatus
                    ){
                        return false;
                    }

                    /* =========================
                       TARGET JENIS PEGAWAI
                    ========================= */
                    const targetJenis =
                        String(
                            item.targetJenis || ""
                        )
                        .toUpperCase()
                        .trim();

                    const jenisPegawai =
                        String(
                            pegawai.jenisPegawai || ""
                        )
                        .toUpperCase()
                        .trim();

                    const cocokJenis =
                        targetJenis === "" ||
                        targetJenis === "ALL" ||
                        targetJenis === jenisPegawai;
                    if(
                        !cocokJenis
                    ){
                        return false;
                    }

                    /* =========================
                       FILTER PENDIDIKAN
                    ========================= */
                    const filterPendidikan =
                        String(
                            item.filterPendidikan || "ALL"
                        )
                        .trim()
                        .toUpperCase();

                    const cocokPendidikan =
                        filterPendidikan === "ALL" ||
                        filterPendidikan === "" ||
                        riwayatPendidikan.includes(
                            filterPendidikan
                        );
                    if(
                        !cocokPendidikan
                    ){
                        return false;
                    }

                    /* ======================================================
                       FILTER PANGKAT / GOLONGAN
                    ====================================================== */
                    const listGolongan =
                        String(
                            item.pangkatGolongan || ""
                        )
                        .toUpperCase()
                        .split(/[;,]/)
                        .map(
                            golongan =>
                                normalisasiGolongan(
                                    golongan
                                )
                        )
                        .filter(
                            Boolean
                        );

                    const cocokGolongan =
                        listGolongan.length === 0 ||
                        listGolongan.includes("ALL") ||
                        listGolongan.some(
                            golongan =>
                                riwayatGolongan
                                    .map(
                                        g =>
                                            normalisasiGolongan(g)
                                    )
                                    .includes(
                                        golongan
                                    )
                        );

                    /*console.log(
                        "DOKUMEN DEBUG FILTER GOLONGAN",
                        {
                            namaDokumen:
                                item.namaDokumen,
                            masterGolongan:
                                listGolongan,
                            pegawaiGolongan:
                                riwayatGolongan,
                            cocok:
                                cocokGolongan
                        }
                    );*/

                    if(
                        !cocokGolongan
                    ){
                        return false;
                    }

                    /* ======================================================
                       FILTER JENJANG JABATAN
                    ====================================================== */
                    const listJenjang =
                        String(
                            item.jenjangJabatan || ""
                        )
                        .toUpperCase()
                        .split(/[;,]/)
                        .map(
                            jenjang =>
                                jenjang
                                    .trim()
                                    .replace(/\s+/g, " ")
                        )
                        .filter(
                            Boolean
                        );

                    const cocokJenjangJabatan =
                        listJenjang.length === 0 ||
                        listJenjang.includes("ALL") ||
                        listJenjang.some(
                            jenjang =>
                                riwayatJenjangJabatan.includes(
                                    jenjang
                                )
                        );

                    /*console.log(
                        "DOKUMEN DEBUG FILTER JENJANG",
                        {
                            namaDokumen:
                                item.namaDokumen,
                            masterJenjang:
                                listJenjang,
                            pegawaiJenjang:
                                riwayatJenjangJabatan,
                            cocok:
                                cocokJenjangJabatan
                        }
                    );*/

                    if(
                        !cocokJenjangJabatan
                    ){
                        return false;
                    }

                    /* =========================
                       FILTER TAHUN
                    ========================= */
                    let cocokTahun = true;

                    if(
                        item.tahunDokumen > 0
                    ){
                        if(
                            String(
                                item.targetStatus || ""
                            )
                            .toUpperCase()
                            .trim() === "BLUD"
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
                                item.tahunDokumen >=
                                    tahunMulai &&
                                item.tahunDokumen <=
                                    tahunSelesai;
                        }
                        else{
                            cocokTahun =
                                item.tahunDokumen >=
                                tahunTmtAwal;
                        }
                    }

                    if(
                        !cocokTahun
                    ){
                        return false;
                    }

                    /* =========================
                       LOLOS SEMUA FILTER
                    ========================= */
                    return true;
                }
            )

            /* =========================
               URUTKAN BERDASARKAN
               NAMA DOKUMEN
            ========================= */
            .sort(
                (a, b) =>
                    String(
                        a.namaDokumen || ""
                    ).localeCompare(
                        String(
                            b.namaDokumen || ""
                        ),

                        "id",

                        {
                            sensitivity: "base"
                        }
                    )
            );
    }
    catch(error){
        console.error(
            "Firestore Get Master Dokumen Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal mengambil master dokumen dari Firestore."
        );
    }
}


/* ======================================================
   GET DOKUMEN PEGAWAI
====================================================== */
export async function smartofficeGetDokumenPegawaiFirestore(nip){

    try{
        const nipValue =
            String(nip || "").trim();

        if(!nipValue){
            throw new Error(
                "NIP tidak boleh kosong."
            );
        }

        /* =========================
           GET MASTER YANG SUDAH
           TERFILTER SESUAI PEGAWAI
        ========================= */
        const masterData =
            await smartofficeGetMasterDokumenFirestore(
                nipValue
            );

        /* =========================
           GET DOKUMEN YANG SUDAH UPLOAD
        ========================= */
        const q =
            query(
                collection(
                    smartofficeFirestore,
                    "dokumenPegawai"
                ),
                where(
                    "nip",
                    "==",
                    nipValue
                )
            );

        const dokumenSnapshot =
            await getDocs(q);

        /* =========================
           GROUP DOKUMEN PEGAWAI
        ========================= */
        const dokumenMap = {};

        dokumenSnapshot.docs.forEach(
            docSnapshot => {
                const data =
                    docSnapshot.data();

                const kode =
                    data.kodeDokumen || "";
                if(!kode){
                    return;
                }

                if(!dokumenMap[kode]){
                    dokumenMap[kode] = [];
                }

                dokumenMap[kode].push({
                    idDokumen:
                        data.idDokumen ||
                        docSnapshot.id,
                    kodeDokumen:
                        kode,
                    namaDokumen:
                        data.namaDokumen || "",
                    grupDokumen:
                        data.grupDokumen || "",           
                    uploaded:
                        true,
                    nomorDokumen:
                        data.nomorDokumen || "",
                    fileName:
                        data.namaFile || "",
                    fileId:
                        data.fileId || "",
                    fileUrl:
                        data.fileUrl || "",
                    statusVerifikasi:
                        data.statusVerifikasi || "",
                    isLock:
                        data.isLock || "TIDAK",
                    keterangan:
                        data.keterangan || "",
                    catatanVerifikator:
                        data.catatanVerifikator || "",
                    alasanBukaLock:
                        data.alasanBukaLock || "",
                    openLockBy:
                        data.openLockBy || "",
                    openLockAt:
                        data.openLockAt || ""
                });
            }
        );

        /* =========================
           GABUNG MASTER + UPLOAD
        ========================= */
        const result = [];
        masterData.forEach(
            master => {
                const uploadedList =
                    dokumenMap[
                        master.kodeDokumen
                    ] || [];

                /* =========================
                   MULTI UPLOAD
                ========================= */
                if(
                    master.multiUpload === "YA"
                ){
                    uploadedList.forEach(
                        dokumen => {
                            result.push({
                                ...master,
                                ...dokumen
                            });
                        }
                    );

                    return;
                }

                /* =========================
                   SINGLE UPLOAD
                ========================= */
                if(
                    uploadedList.length > 0
                ){
                    result.push({
                        ...master,
                        ...uploadedList[0]
                    });
                }
                else{
                    /* =========================
                       BELUM UPLOAD
                    ========================= */
                    result.push({
                        idDokumen: "",
                        kodeDokumen:
                            master.kodeDokumen,
                        namaDokumen:
                            master.namaDokumen,
                        grupDokumen:
                            master.grupDokumen,
                        wajibUpload:
                            master.wajibUpload,
                        uploaded:
                            false,
                        nomorDokumen: "",
                        fileName: "",
                        fileId: "",
                        fileUrl: "",
                        statusVerifikasi: "",
                        isLock: "TIDAK",
                        keterangan: "",
                        catatanVerifikator: "",
                        alasanBukaLock: "",
                        openLockBy: "",
                        openLockAt: "",
                        multiUpload:
                            master.multiUpload
                    });
                }
            }
        );

        /* =========================
           URUT ABJAD
        ========================= */
        result.sort(
            (a, b) =>
                String(
                    a.namaDokumen || ""
                ).localeCompare(
                    String(
                        b.namaDokumen || ""
                    ),
                    "id",
                    {
                        sensitivity: "base"
                    }
                )
        );

        return result;
    }
    catch(error){
        console.error(
            "Firestore Get Dokumen Pegawai Error:",
            error
        );

        throw new Error(
            error?.message ||
            "Gagal mengambil dokumen pegawai dari Firestore."
        );
    }
}