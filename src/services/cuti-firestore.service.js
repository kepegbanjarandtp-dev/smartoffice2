/* ======================================================
   SMART OFFICE V3
   FIRESTORE - CUTI
====================================================== */
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    getCountFromServer,
    onSnapshot
} from "firebase/firestore";

import {
    smartofficeFirestore
} from "../core/firebase-firestore.js";


/* ======================================================
   GET RIWAYAT CUTI USER
====================================================== */
export async function smartofficeGetRiwayatCutiFirestore(nip) {

    const q = query(
        collection(smartofficeFirestore, "cuti"),
        where("nipNrp", "==", String(nip).trim())
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {

        const d = doc.data();

        return {
            ...d,

            // Mapping Firestore → format yang dipakai frontend
            tanggalSurat: d.tanggalSuratPermohonan,
            tanggalAwal: d.tanggalAwalCuti,
            tanggalAkhir: d.tanggalAkhirCuti,

            lampiran: d.fileLampiranUrl,

            delegasi: d.penerimaDelegasi,
            nipDelegasi: d.nipNrpDelegasi,
            tugasDelegasi: d.tugasYangDidelegasikan,

            approval1Tanggal: d.approval1Tgl,
            approval2Tanggal: d.approval2Tgl,

            pdfUrl: d.filePdfUrl
        };
    });
}



/* ======================================================
   GET CUTI STATS USER
====================================================== */
export async function smartofficeGetCutiStatsFirestore(nip) {

    const nipValue = String(nip || "").trim();

    if (!nipValue) {
        return {
            success: false,
            message: "NIP tidak boleh kosong."
        };
    }

    try {

        // AMBIL REFERENSI
        const pegawaiRef = doc(
            smartofficeFirestore,
            "pegawai",
            nipValue
        );

        const cutiRef = collection(
            smartofficeFirestore,
            "cuti"
        );

        // QUERY TOTAL MENUNGGU
        const qMenunggu = query(
            cutiRef,
            where("nipNrp", "==", nipValue),
            where("status", "in", [
                "MENUNGGU_APPROVAL_1",
                "MENUNGGU_APPROVAL_2"
            ])
        );

        // QUERY TOTAL DISETUJUI
        const qDisetujui = query(
            cutiRef,
            where("nipNrp", "==", nipValue),
            where("status", "==", "DISETUJUI")
        );

        // AMBIL DATA SECARA PARALEL
        const [
            pegawaiSnapshot,
            menungguSnapshot,
            disetujuiSnapshot
        ] = await Promise.all([
            getDoc(pegawaiRef),
            getCountFromServer(qMenunggu),
            getCountFromServer(qDisetujui)
        ]);

        // SISA CUTI
        let sisaCuti = 0;

        if (pegawaiSnapshot.exists()) {
            const pegawai = pegawaiSnapshot.data();
            sisaCuti = Number(pegawai.sisaCuti || 0);
        }

        return {
            success: true,
            data: {
                sisaCuti: sisaCuti,
                totalMenunggu: menungguSnapshot.data().count,
                totalDisetujui: disetujuiSnapshot.data().count
            }
        };

    } catch (error) {
        console.error(
            "Gagal mengambil statistik cuti:",
            error
        );

        return {
            success: false,
            message: error.message || "Gagal mengambil statistik cuti."
        };
    }
}


/* ======================================================
   WATCH SUBMIT CUTI
   POLA SAMA DENGAN SUBMIT DOKUMEN
   WRITE TETAP MELALUI GAS
====================================================== */
export function smartofficeWatchSubmitCutiFirestore(nip){

    const targetNip =
        String(nip || "").trim();

    let initialized = false;
    let settled = false;
    let unsubscribe = function(){};

    let readyResolve;
    let readyReject;
    let promiseResolve;
    let promiseReject;

    const baselineIds = new Set();

    const ready = new Promise((resolve, reject) => {
        readyResolve = resolve;
        readyReject = reject;
    });

    const promise = new Promise((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;
    });

    function resolveSuccess(result){
        if(settled) return;

        settled = true;
        promiseResolve(result);
    }

    function rejectError(error){
        if(settled) return;

        settled = true;
        promiseReject(error);
    }

    if(!targetNip){
        const error =
            new Error("NIP pegawai tidak ditemukan.");

        readyReject(error);
        rejectError(error);

        return {
            ready,
            promise,
            unsubscribe
        };
    }

    const q = query(
        collection(smartofficeFirestore, "cuti"),
        where("nipNrp", "==", targetNip)
    );

    unsubscribe = onSnapshot(
        q,

        snapshot => {

            /* SNAPSHOT PERTAMA = BASELINE */
            if(!initialized){

                snapshot.docs.forEach(docSnapshot => {
                    const data = docSnapshot.data();

                    baselineIds.add(
                        String(
                            data.idCuti || docSnapshot.id
                        ).trim()
                    );

                    baselineIds.add(
                        String(docSnapshot.id).trim()
                    );
                });

                initialized = true;
                readyResolve();
                return;
            }

            /* DOKUMEN BARU = KONFIRMASI FIRESTORE */
            snapshot.docChanges().forEach(change => {

                if(
                    change.type !== "added" ||
                    settled
                ){
                    return;
                }

                const docSnapshot = change.doc;
                const data = docSnapshot.data();

                const idCuti =
                    String(
                        data.idCuti || docSnapshot.id
                    ).trim();

                const docId =
                    String(docSnapshot.id).trim();

                if(
                    !idCuti ||
                    baselineIds.has(idCuti) ||
                    baselineIds.has(docId)
                ){
                    return;
                }

                resolveSuccess({
                    success: true,
                    source: "firestore",
                    idCuti,
                    data
                });
            });
        },

        error => {
            if(!initialized){
                initialized = true;
                readyReject(error);
            }

            rejectError(error);
        }
    );

    return {
        ready,
        promise,
        unsubscribe
    };
}