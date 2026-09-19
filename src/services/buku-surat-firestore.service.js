import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";


/* =====================================================
   MASTER SURAT
===================================================== */
export async function smartofficeGetMasterSuratFirestore(){

    try{
        const ref =
            doc(
                smartofficeFirestore,
                "masterSurat",
                "master"
            );

        const snapshot =
            await getDoc(ref);

        if(!snapshot.exists()){
            throw new Error(
                "Master Surat tidak ditemukan di Firestore."
            );
        }

        const data =
            snapshot.data();

        return {
            klasifikasi:
                Array.isArray(
                    data.klasifikasi
                )
                    ? data.klasifikasi
                    : [],

            sifat:
                Array.isArray(
                    data.sifat
                )
                    ? data.sifat
                    : [],

            tujuan:
                Array.isArray(
                    data.tujuan
                )
                    ? data.tujuan
                    : [],

            penandatangan:
                Array.isArray(
                    data.penandatangan
                )
                    ? data.penandatangan
                    : []
        };
    }
    catch(error){
        console.error(
            "Get Master Surat Firestore Error:",
            error
        );

        throw error;
    }
}


/* =====================================================
   SURAT MASUK
   QUERY BERDASARKAN BULAN
===================================================== */
export async function smartofficeGetSuratMasukFirestore(
    bulan,
    tahun
){
    try{
        const bulanNumber =
            String(bulan).padStart(2, "0");

        const tahunNumber =
            String(tahun);

        const tanggalAwal =
            `${tahunNumber}-${bulanNumber}-01`;

        const bulanBerikutnya =
            Number(bulanNumber) === 12
                ? 1
                : Number(bulanNumber) + 1;

        const tahunBerikutnya =
            Number(bulanNumber) === 12
                ? Number(tahunNumber) + 1
                : Number(tahunNumber);

        const tanggalAkhir =
            `${tahunBerikutnya}-${String(
                bulanBerikutnya
            ).padStart(2, "0")}-01`;

        console.log(
            "FIRESTORE SURAT MASUK:",
            tanggalAwal,
            "sampai",
            tanggalAkhir
        );

        const q =
            query(
                collection(
                    smartofficeFirestore,
                    "suratMasuk"
                ),
                where(
                    "tanggalTerima",
                    ">=",
                    tanggalAwal
                ),
                where(
                    "tanggalTerima",
                    "<",
                    tanggalAkhir
                )
            );

        const snapshot =
            await getDocs(q);

        const result =
            snapshot.docs.map(
                docSnapshot => {
                    const data =
                        docSnapshot.data();
                    return {
                        rowIndex:
                            data.rowIndex || 0,

                        nomorAgenda:
                            data.nomorAgenda || "",

                        timestamp:
                            data.timestamp || "",

                        timestampDisplay:
                            data.timestampDisplay || "",

                        tglTerima:
                            data.tanggalTerimaDisplay ||
                            data.tanggalTerima ||
                            "",

                        tglSurat:
                            data.tanggalSuratDisplay ||
                            data.tanggalSurat ||
                            "",

                        nomorSurat:
                            data.nomorSurat || "",

                        pengirim:
                            data.pengirim || "",

                        perihal:
                            data.perihal || "",

                        sifatSurat:
                            data.sifatSurat || "",

                        disposisiKe:
                            data.disposisiKe || "",

                        linkDokumen:
                            data.linkDokumen || "",

                        status:
                            data.status || ""
                    };
                }
            );

        /* URUTKAN TERBARU */
        result.sort(
            (a, b) =>
                new Date(
                    b.tanggalTerima
                ) -
                new Date(
                    a.tanggalTerima
                )
        );

        return result;
    }
    catch(error){
        console.error(
            "Get Surat Masuk Firestore Error:",
            error
        );

        throw error;
    }
}


/* =====================================================
   SURAT KELUAR
   READ BERDASARKAN TANGGAL / BULAN SURAT
===================================================== */
export async function smartofficeGetSuratKeluarFirestore(
    tanggal = "",
    mode = "tanggal"
){
    try{
        const tanggalValue =
            String(tanggal || "").trim();

        if(!tanggalValue){
            throw new Error(
                "Tanggal / bulan Surat Keluar wajib diisi."
            );
        }
        let q;

        /* ==================================================
           MODE TANGGAL
           CONTOH:
           2026-02-04
        ================================================== */
        if(mode === "tanggal"){
            console.log(
                "FIRESTORE SURAT KELUAR TANGGAL:",
                tanggalValue
            );

            q =
                query(
                    collection(
                        smartofficeFirestore,
                        "suratKeluar"
                    ),
                    where(
                        "tanggalSurat",
                        "==",
                        tanggalValue
                    )
                );
        }

        /* ==================================================
           MODE BULAN
           CONTOH:
           2026-02

           QUERY:
           >= 2026-02-01
           <  2026-03-01
        ================================================== */
        else if(mode === "bulan"){

            const parts =
                tanggalValue.split("-");

            const tahun =
                Number(parts[0]);

            const bulan =
                Number(parts[1]);

            if(
                !tahun ||
                !bulan ||
                bulan < 1 ||
                bulan > 12
            ){
                throw new Error(
                    "Format bulan Surat Keluar tidak valid."
                );
            }

            const tanggalAwal =
                `${tahun}-${String(
                    bulan
                ).padStart(
                    2,
                    "0"
                )}-01`;

            const bulanBerikutnya =
                bulan === 12
                    ? 1
                    : bulan + 1;

            const tahunBerikutnya =
                bulan === 12
                    ? tahun + 1
                    : tahun;

            const tanggalAkhir =
                `${tahunBerikutnya}-${String(
                    bulanBerikutnya
                ).padStart(
                    2,
                    "0"
                )}-01`;

            console.log(
                "FIRESTORE SURAT KELUAR BULAN:",
                tanggalAwal,
                "sampai",
                tanggalAkhir
            );

            q =
                query(
                    collection(
                        smartofficeFirestore,
                        "suratKeluar"
                    ),
                    where(
                        "tanggalSurat",
                        ">=",
                        tanggalAwal
                    ),
                    where(
                        "tanggalSurat",
                        "<",
                        tanggalAkhir
                    )
                );
        }
        else{
            throw new Error(
                "Mode Surat Keluar tidak dikenal."
            );
        }

        /* ==================================================
           AMBIL DATA
        ================================================== */
        const snapshot =
            await getDocs(q);

        /* ==================================================
           MAPPING
           PERTAHANKAN FIELD FRONTEND LAMA
        ================================================== */
        const result =
            snapshot.docs.map(
                docSnapshot => {
                    const data =
                        docSnapshot.data();

                    return {
                        rowIndex:
                            data.rowIndex || 0,

                        /* =========================
                           ID INTERNAL
                        ========================= */
                        nomor:
                            data.nomor ||
                            docSnapshot.id,

                        timestamp:
                            data.timestamp ||
                            "",

                        timestampDisplay:
                            data.timestampDisplay ||
                            "",

                        /* =========================
                           NOMOR SURAT LENGKAP
                        ========================= */
                        nomorSurat:
                            data.nomorSurat ||
                            "",

                        /* =========================
                           KOMPATIBILITAS FRONTEND
                        ========================= */
                        tanggal:
                            data.tanggalSuratDisplay ||
                            data.tanggalSurat ||
                            "",

                        tanggalSurat:
                            data.tanggalSurat ||
                            "",

                        tanggalSuratDisplay:
                            data.tanggalSuratDisplay ||
                            "",

                        kodeSurat:
                            data.kodeSurat ||
                            "",

                        klasifikasiSurat:
                            data.klasifikasiSurat ||
                            "",

                        sifatSurat:
                            data.sifatSurat ||
                            "",

                        tujuan:
                            data.tujuanPenerima ||
                            "",

                        tujuanPenerima:
                            data.tujuanPenerima ||
                            "",

                        perihal:
                            data.perihal ||
                            "",

                        pejabatPenandatangan:
                            data.pejabatPenandatangan ||
                            "",

                        keterangan:
                            data.keterangan ||
                            "",

                        fileSurat:
                            data.fileSurat ||
                            "",

                        status:
                            data.status ||
                            ""
                    };
                }
            );

        /* ==================================================
           URUTKAN NOMOR ASCENDING
           0466 → 0467 → 0468
        ================================================== */
        result.sort(
            (a, b) =>
                String(
                    a.nomor
                ).localeCompare(
                    String(
                        b.nomor
                    ),
                    undefined,
                    {
                        numeric:true
                    }
                )
        );
        console.log(
            "HASIL SURAT KELUAR FIRESTORE:",
            result.length
        );

        return result;
    }catch(error){
        console.error(
            "Get Surat Keluar Firestore Error:",
            error
        );

        throw error;
    }
}