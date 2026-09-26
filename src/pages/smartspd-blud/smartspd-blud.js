/* ======================================================
   SMART OFFICE — SMARTSPD BLUD
   VITE / SPA / PWA MODULE
====================================================== */

/* ================================================================================================
   1. IMPORT
================================================================================================ */

/* ======================================================
   1.1 CORE
====================================================== */
import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeLogout
} from "../../core/session.js";

import {
    smartofficeNavigate
} from "../../core/router.js";

/* ======================================================
   1.2 COMPONENT
====================================================== */
import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

/* ======================================================
   1.3 SERVICE
====================================================== */
import {
    smartofficeSubmitSPD
} from "../../services/smartspd-blud.service.js";

import {
    smartofficeGetPegawaiFromFirestore,
    smartofficeGetAllPegawaiFromFirestore
} from "../../services/pegawai-firestore.service.js";

/* ======================================================
   1.4 UTILS
====================================================== */
import {
    smartofficeConvertFileToBase64
} from "../../utils/file.js";

import "./smartspd-blud.css";



/* ================================================================================================
   2. STATE
================================================================================================ */

/* ======================================================
   2.1 DATA PEGAWAI
====================================================== */
let smartofficeSPDPegawai = {};
let smartofficeSPDPegawaiCache = [];
let smartofficeSPDRiwayat = [];

/* ======================================================
   2.2 DATA FORM
====================================================== */
let smartofficeSPDJumlahPengikut = 0;

/* ======================================================
   2.3 DATA PENGIKUT
====================================================== */
let smartofficeSPDFile = null;

/* ======================================================
   2.4 FILE UPLOAD
====================================================== */
let smartofficeSubmitting = false;

/* ======================================================
   2.5 SUBMIT
====================================================== */
let smartofficeSPDHandlers = new Map();

/* ======================================================
   2.6 EVENT / LIFECYCLE
====================================================== */
let smartofficeSPDPageInstance = 0;



/* ================================================================================================
   3. PAGE LIFECYCLE
================================================================================================ */

/* ======================================================
   3.1 LOAD SMARTSPD BLUD PAGE
====================================================== */
export async function smartofficeLoadPage(){

    smartofficeSPDPageInstance++;
    const pageInstance = smartofficeSPDPageInstance;

    smartofficeSPDJumlahPengikut = 0;
    smartofficeSPDFile = null;
    smartofficeSubmitting = false;
    smartofficeSPDPegawai = {};
    smartofficeSPDPegawaiCache = [];
    smartofficeSPDRiwayat = [];
    smartofficeSPDHandlers = new Map();

    /* =========================
       SESSION
    ========================= */
    if(!smartofficeCheckSession()){
        await smartofficeNavigate("login");
        return;
    }

    const sessionData =
        smartofficeGetSession();

    if(!sessionData){
        await smartofficeLogout();
        return;
    }

    /* =========================
       MOBILE NAVBAR
    ========================= */
    smartofficeRenderMobileNavbar(
        sessionData.role,
        "spd"
    );

    /* =========================
       INIT UI
    ========================= */
    smartofficeInitSPDEvents(pageInstance);
    smartofficeSwitchSPDTab("form");
    smartofficeInitPengikut();
    smartofficeInitProgress();
    smartofficeInitFileUpload();
    smartofficeInitTripType();
    smartofficeInitSchedule();
    smartofficeInitSubmitButton();
    smartofficeInitOutsideAutocomplete();
    smartofficeUpdateSubmitButton();

    /* =========================
       LOAD PEGAWAI
       READ → FIRESTORE
    ========================= */
    await Promise.all([
        smartofficeLoadSPDpegawai(sessionData.nip),
        smartofficeLoadSPDPegawaiCache()
    ]);

    /* =========================
       HISTORY
       READ FIRESTORE MIRROR

       Collection/schema belum diberikan
       pada source migrasi, jadi fungsi ini
       tidak menggunakan GAS untuk read.
    ========================= */
    smartofficeRenderRiwayatSPDUnavailable();
}

/* ======================================================
   3.2 DESTROY SMARTSPD BLUD PAGE
====================================================== */
export async function smartofficeDestroyPage(){

    smartofficeSPDHandlers.forEach(
        function(handler){
            if(handler.type === "__observer__"){
                try{
                    handler.callback.disconnect();
                }
                catch(error){}
                return;
            }

            if(handler.element){
                handler.element.removeEventListener(
                    handler.type,
                    handler.callback
                );
            }
        }
    );

    smartofficeSPDHandlers.clear();
    smartofficeSPDPegawai = {};
    smartofficeSPDPegawaiCache = [];
    smartofficeSPDRiwayat = [];
    smartofficeSPDJumlahPengikut = 0;
    smartofficeSPDFile = null;
    smartofficeSubmitting = false;
}



/* ================================================================================================
   4. EVENT MANAGEMENT
================================================================================================ */

/* ======================================================
   4.1 REGISTER EVENT HANDLER
====================================================== */
function smartofficeSPDAddHandler(
    element,
    type,
    callback
){
    if(!element){
        return;
    }

    element.addEventListener(type, callback);

    smartofficeSPDHandlers.set(
        `${type}-${smartofficeSPDHandlers.size}`,
        {
            type,
            callback,
            element
        }
    );
}

/* ======================================================
   4.2 INIT PAGE EVENTS
====================================================== */
function smartofficeInitSPDEvents(pageInstance){

    /* BACK */
    const backButton =
        document.querySelector(
            '[data-action="back-dashboard"]'
        );

    smartofficeSPDAddHandler(
        backButton,
        "click",
        async function(){
            if(pageInstance !== smartofficeSPDPageInstance){
                return;
            }

            await smartofficeNavigate("dashboard");
        }
    );

    /* REFRESH */
    const refreshButton =
        document.querySelector(
            '[data-action="refresh"]'
        );

    smartofficeSPDAddHandler(
        refreshButton,
        "click",
        async function(){
            await smartofficeRefreshSPD();
        }
    );

    /* TAB */
    document
        .querySelectorAll(
            "[data-tab]"
        )
        .forEach(function(button){

            smartofficeSPDAddHandler(
                button,
                "click",
                function(){

                    smartofficeSwitchSPDTab(
                        button.dataset.tab
                    );

                }
            );
        });

    /* FILTER */
    document
        .querySelectorAll(
            "[data-status]"
        )
        .forEach(function(button){

            smartofficeSPDAddHandler(
                button,
                "click",
                function(){

                    smartofficeFilterRiwayatSPD(
                        button.dataset.status,
                        button
                    );

                }
            );
        });

    /* ACCORDION */
    const scheduleButton =
        document.querySelector(
            '[data-action="toggle-schedule"]'
        );

    smartofficeSPDAddHandler(
        scheduleButton,
        "click",
        smartofficeToggleSPDJadwal
    );

}



/* ================================================================================================
   5. DATA PEGAWAI
================================================================================================ */

/* ======================================================
   5.1 LOAD DATA PEGAWAI — FIRESTORE
====================================================== */
async function smartofficeLoadSPDpegawai(nip){

    try{
        const result =
            await smartofficeGetPegawaiFromFirestore(
                nip
            );
        if(!result || !result.success){
            throw new Error(
                result?.message ||
                "Data pegawai tidak ditemukan."
            );
        }

        smartofficeSPDPegawai =
            result.data || {};

        smartofficeRenderSPDPegawai();
    }
    catch(error){
        console.error(
            "SMARTSPD BLUD LOAD PEGAWAI ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "Gagal memuat data pegawai.",
            "error"
        );
    }
}


/* ======================================================
   5.2 LOAD CACHE SEMUA PEGAWAI — FIRESTORE
====================================================== */
async function smartofficeLoadSPDPegawaiCache(){

    try{
        const result =
            await smartofficeGetAllPegawaiFromFirestore();
        if(!result || !result.success){
            throw new Error(
                result?.message ||
                "Gagal mengambil data pegawai."
            );
        }

        smartofficeSPDPegawaiCache =
            Array.isArray(result.data)
                ? result.data
                : [];
    }
    catch(error){
        console.error(
            "SMARTSPD BLUD CACHE PEGAWAI ERROR:",
            error
        );

        smartofficeShowToast(
            "Gagal memuat daftar pegawai.",
            "error"
        );
    }
}

/* ======================================================
   5.3 RENDER DATA PEGAWAI
====================================================== */
function smartofficeRenderSPDPegawai(){

    const fields = [
        ["smartofficeSPDNama", "nama"],
        ["smartofficeSPDNip", "nip"],
        ["smartofficeSPDPangkat", "pangkat"],
        ["smartofficeSPDJabatan", "jabatan"],
        ["smartofficeSPDEmail", "email"],
        ["smartofficeSPDNoWA", "noWa"]
    ];

    fields.forEach(function(item){
        const element =
            document.getElementById(item[0]);
        if(element){
            element.value =
                smartofficeSPDPegawai?.[item[1]] || "";
        }
    });

    smartofficeInitMainPegawaiAutocomplete();
    smartofficeUpdateProgress();
    smartofficeUpdateSubmitButton();
}



/* ================================================================================================
   6. AUTOCOMPLETE PEGAWAI UTAMA
================================================================================================ */

/* ======================================================
   6.1 INIT AUTOCOMPLETE PEGAWAI UTAMA
====================================================== */
function smartofficeInitMainPegawaiAutocomplete(){

    const input =
        document.getElementById(
            "smartofficeSPDNama"
        );

    const resultBox =
        document.getElementById(
            "smartofficeSPDNamaAutocomplete"
        );
    if(!input || !resultBox){
        return;
    }

    smartofficeSPDAddHandler(
        input,
        "input",
        function(){
            const keyword =
                input.value
                    .trim()
                    .toLowerCase();

            resultBox.innerHTML = "";
            if(keyword.length < 1){
                return;
            }

            const filtered =
                smartofficeSPDPegawaiCache
                    .filter(function(item){

                        return String(
                            item.nama || ""
                        )
                        .toLowerCase()
                        .includes(keyword);
                    })
                    .slice(0,10);
            if(filtered.length === 0){
                resultBox.innerHTML =
                    `<div class="smartoffice-cuti-autocomplete-empty">
                        Pegawai tidak ditemukan
                    </div>`;
                return;
            }

            filtered.forEach(function(item){
                const div =
                    document.createElement("div");

                div.className =
                    "smartoffice-spd-autocomplete-item";

                div.innerHTML = `
                    <strong>${smartofficeEscapeHtml(item.nama || "")}</strong>
                    <span>${smartofficeEscapeHtml(item.nip || "")}</span>
                `;

                div.addEventListener(
                    "click",
                    function(){
                        smartofficeSelectMainPegawai(item);
                    }
                );

                resultBox.appendChild(div);
            });

        }
    );
}

/* ======================================================
   6.2 PILIH PEGAWAI UTAMA
====================================================== */
function smartofficeSelectMainPegawai(item){

    smartofficeSPDPegawai =
        item || {};

    smartofficeRenderSPDPegawai();

    const resultBox =
        document.getElementById(
            "smartofficeSPDNamaAutocomplete"
        );

    if(resultBox){
        resultBox.innerHTML = "";
    }
}



/* ================================================================================================
   7. PAGE ACTION
================================================================================================ */

/* ======================================================
   7.1 REFRESH DATA SPD
====================================================== */
export async function smartofficeRefreshSPD(){

    smartofficeShowToast(
        "Memuat ulang data...",
        "info"
    );

    const sessionData =
        smartofficeGetSession();

    if(!sessionData){
        await smartofficeNavigate("login");
        return;
    }

    await Promise.all([
        smartofficeLoadSPDpegawai(sessionData.nip),
        smartofficeLoadSPDPegawaiCache()
    ]);

    smartofficeShowToast(
        "Data berhasil diperbarui.",
        "success"
    );
}

/* ======================================================
   7.2 SWITCH TAB SPD
====================================================== */
export function smartofficeSwitchSPDTab(tab){

    const tabForm =
        document.getElementById(
            "smartofficeTabFormSPD"
        );

    const tabRiwayat =
        document.getElementById(
            "smartofficeTabRiwayatSPD"
        );

    const formContent =
        document.getElementById(
            "smartofficeFormSPDContent"
        );

    const historyContent =
        document.getElementById(
            "smartofficeRiwayatSPDContent"
        );

    if(!tabForm || !tabRiwayat || !formContent || !historyContent){
        return;
    }

    const isForm =
        tab === "form";

    tabForm.classList.toggle("active", isForm);
    tabRiwayat.classList.toggle("active", !isForm);

    formContent.style.display =
        isForm ? "block" : "none";

    historyContent.style.display =
        isForm ? "none" : "block";
}



/* ================================================================================================
   8. DATA PENGIKUT
================================================================================================ */

/* ======================================================
   8.1 INIT TOMBOL TAMBAH PENGIKUT
====================================================== */
function smartofficeInitPengikut(){

    const button =
        document.getElementById(
            "smartofficeSPDBtnTambahPengikut"
        );

    smartofficeSPDAddHandler(
        button,
        "click",
        smartofficeTambahPengikut
    );

    smartofficeUpdateButtonTambahPengikut();
}

/* ======================================================
   8.2 TAMBAH PENGIKUT
====================================================== */
function smartofficeTambahPengikut(){

    if(smartofficeSPDJumlahPengikut >= 4){
        return;
    }

    smartofficeSPDJumlahPengikut++;

    const nomor =
        smartofficeSPDJumlahPengikut;

    const container =
        document.getElementById(
            "smartofficeSPDPengikutContainer"
        );

    if(!container){
        return;
    }

    const card =
        document.createElement("div");

    card.className =
        "smartoffice-spd-pengikut-item";

    card.dataset.index =
        nomor;

    card.innerHTML = `
        <div class="smartoffice-spd-pengikut-card-header">
            <span class="smartoffice-spd-pengikut-title">
                Pengikut ${nomor}
            </span>
            <button
                type="button"
                class="smartoffice-spd-pengikut-remove"
                data-action="remove-pengikut"
            >
                Hapus
            </button>
        </div>

        <div class="smartoffice-spd-form-group">
            <label>Nama Pegawai</label>

            <div class="smartoffice-spd-autocomplete-wrapper">
                <input
                    type="text"
                    class="smartoffice-spd-pengikut-nama"
                    autocomplete="off"
                    placeholder="Cari nama pegawai..."
                >
                <div class="smartoffice-spd-autocomplete"></div>
            </div>
        </div>

        <div class="smartoffice-spd-form-group">
            <label>NIP / NRP</label>
            <input
                type="text"
                class="smartoffice-spd-pengikut-nip"
                readonly
            >
        </div>

        <div class="smartoffice-spd-form-group">
            <label>Tanggal Lahir</label>
            <input
                type="text"
                class="smartoffice-spd-pengikut-tgllahir"
                readonly
            >
        </div>

        <div class="smartoffice-spd-form-group">
            <label>No. WhatsApp</label>
            <input
                type="text"
                class="smartoffice-spd-pengikut-no-wa"
                readonly
            >
        </div>
    `;

    container.appendChild(card);

    const removeButton =
        card.querySelector(
            '[data-action="remove-pengikut"]'
        );

    smartofficeSPDAddHandler(
        removeButton,
        "click",
        function(){
            smartofficeHapusPengikut(card);
        }
    );

    smartofficeInitPengikutAutocomplete(card);
    smartofficeUpdateButtonTambahPengikut();
    smartofficeUpdateProgress();
}

/* ======================================================
   8.3 HAPUS PENGIKUT
====================================================== */
function smartofficeHapusPengikut(card){

    if(!card){
        return;
    }

    card.remove();
    smartofficeRefreshNomorPengikut();
    smartofficeUpdateButtonTambahPengikut();
    smartofficeUpdateProgress();
}

/* ======================================================
   8.4 REFRESH NOMOR PENGIKUT
====================================================== */
function smartofficeRefreshNomorPengikut(){

    const cards =
        document.querySelectorAll(
            ".smartoffice-spd-pengikut-item"
        );

    smartofficeSPDJumlahPengikut =
        cards.length;

    cards.forEach(function(card,index){

        const nomor =
            index + 1;

        card.dataset.index = nomor;

        const title =
            card.querySelector(
                ".smartoffice-spd-pengikut-title"
            );
        if(title){
            title.textContent =
                "Pengikut " + nomor;
        }
    });
}

/* ======================================================
   8.5 UPDATE TOMBOL TAMBAH PENGIKUT
====================================================== */
function smartofficeUpdateButtonTambahPengikut(){

    const button =
        document.getElementById(
            "smartofficeSPDBtnTambahPengikut"
        );
    if(button){
        button.disabled =
            smartofficeSPDJumlahPengikut >= 4;
    }
}


/* ================================================================================================
   9. AUTOCOMPLETE PENGIKUT
================================================================================================ */

/* ======================================================
   9.1 INIT AUTOCOMPLETE PENGIKUT
====================================================== */
function smartofficeInitPengikutAutocomplete(card){

    const input =
        card.querySelector(
            ".smartoffice-spd-pengikut-nama"
        );

    const resultBox =
        card.querySelector(
            ".smartoffice-spd-autocomplete"
        );
    if(!input || !resultBox){
        return;
    }

    const render =
        function(){
            const keyword =
                input.value
                    .trim()
                    .toLowerCase();

            resultBox.innerHTML = "";

            if(keyword.length < 1){
                return;
            }

            smartofficeCloseAllPengikutAutocomplete();
            smartofficeRenderPengikutAutocomplete(
                keyword,
                card
            );
        };

    smartofficeSPDAddHandler(
        input,
        "input",
        render
    );

    smartofficeSPDAddHandler(
        input,
        "focus",
        function(){
            const keyword =
                input.value
                    .trim()
                    .toLowerCase();
            if(keyword){
                smartofficeRenderPengikutAutocomplete(
                    keyword,
                    card
                );
            }
        }
    );
}

/* ======================================================
   9.2 RENDER HASIL AUTOCOMPLETE PENGIKUT
====================================================== */
function smartofficeRenderPengikutAutocomplete(
    keyword,
    card
){
    const input =
        card.querySelector(
            ".smartoffice-spd-pengikut-nama"
        );

    const nipInput =
        card.querySelector(
            ".smartoffice-spd-pengikut-nip"
        );

    const tglInput =
        card.querySelector(
            ".smartoffice-spd-pengikut-tgllahir"
        );

    const waInput =
        card.querySelector(
            ".smartoffice-spd-pengikut-no-wa"
        );

    const resultBox =
        card.querySelector(
            ".smartoffice-spd-autocomplete"
        );

    if(!input || !nipInput || !tglInput || !waInput || !resultBox){
        return;
    }

    const usedNip = new Set();

    if(smartofficeSPDPegawai?.nip){
        usedNip.add(
            String(
                smartofficeSPDPegawai.nip
            )
            .trim()
        );
    }

    document
        .querySelectorAll(
            ".smartoffice-spd-pengikut-nip"
        )
        .forEach(function(element){

            const value =
                element.value.trim();

            if(value && element !== nipInput){
                usedNip.add(value);
            }
        });

    const filtered =
        smartofficeSPDPegawaiCache
            .filter(function(item){

                const nama =
                    String(
                        item.nama || ""
                    )
                    .toLowerCase();

                const nip =
                    String(
                        item.nip || ""
                    )
                    .trim();

                return (
                    nama.includes(keyword) &&
                    !usedNip.has(nip)
                );
            })
            .slice(0,10);

    if(filtered.length === 0){
        resultBox.innerHTML = `
            <div class="smartoffice-spd-autocomplete-empty">
                Pegawai tidak ditemukan
            </div>
        `;

        return;
    }

    filtered.forEach(function(item){

        const div =
            document.createElement("div");

        div.className =
            "smartoffice-spd-autocomplete-item";

        div.innerHTML = `
            <strong>${smartofficeEscapeHtml(item.nama || "")}</strong>
            <span>${smartofficeEscapeHtml(item.nip || "")}</span>
        `;

        div.addEventListener(
            "click",
            function(){
                input.value =
                    item.nama || "";

                nipInput.value =
                    item.nip || "";

                tglInput.value =
                    item.tanggalLahir || "";

                waInput.value =
                    item.noWa ||
                    item.noWA ||
                    item.no_wa ||
                    "";
                smartofficeCloseAllPengikutAutocomplete();
                smartofficeUpdateProgress();
            }
        );

        resultBox.appendChild(div);
    });
}

/* ======================================================
   9.3 TUTUP SEMUA AUTOCOMPLETE PENGIKUT
====================================================== */
function smartofficeCloseAllPengikutAutocomplete(){
    document
        .querySelectorAll(
            ".smartoffice-spd-autocomplete"
        )
        .forEach(function(box){
            box.innerHTML = "";
        });
}



/* ================================================================================================
   10. JADWAL PERJALANAN
================================================================================================ */

/* ======================================================
   10.1 INIT INPUT TANGGAL
====================================================== */
function smartofficeInitSchedule(){

    const ids = [
        "smartofficeSPDTanggalSPD",
        "smartofficeSPDTanggalBerangkat",
        "smartofficeSPDTanggalPulang"
    ];

    ids.forEach(function(id){
        const input =
            document.getElementById(id);

        smartofficeSPDAddHandler(
            input,
            "change",
            function(){
                smartofficeValidateDateSunday(
                    input
                );
                smartofficeHitungJumlahHariSPD();
                smartofficeRenderSPDTimeline();
                smartofficeUpdateProgress();
                smartofficeUpdateSubmitButton();
            }
        );
    });
}

/* ======================================================
   10.2 VALIDASI TANGGAL — HARI MINGGU
====================================================== */
function smartofficeValidateDateSunday(input){

    if(!input || !input.value){
        return;
    }

    const date =
        new Date(
            input.value + "T00:00:00"
        );

    if(date.getDay() === 0){
        smartofficeShowToast(
            "Tanggal tidak boleh hari Minggu.",
            "error"
        );

        input.value = "";
    }
}

/* ======================================================
   10.3 HITUNG JUMLAH HARI SPD
====================================================== */
function smartofficeHitungJumlahHariSPD(){

    const mulai =
        document.getElementById(
            "smartofficeSPDTanggalBerangkat"
        )?.value;

    const selesai =
        document.getElementById(
            "smartofficeSPDTanggalPulang"
        )?.value;

    const output =
        document.getElementById(
            "smartofficeSPDJumlahHari"
        );
    if(
        !mulai ||
        !selesai
    ){
        if(output){
            output.value = "";
        }

        return 0;
    }

    const start =
        new Date(
            mulai + "T00:00:00"
        );

    const end =
        new Date(
            selesai + "T00:00:00"
        );

    if(end < start){
        if(output){
            output.value = "";
        }

        smartofficeShowToast(
            "Tanggal pulang tidak boleh sebelum tanggal berangkat.",
            "error"
        );

        return 0;
    }

    const jumlahHari =
        Math.floor(
            (
                end.getTime() -
                start.getTime()
            ) / 86400000
        ) + 1;
    if(output){
        output.value =
            String(jumlahHari);
    }

    return jumlahHari;
}

/* ======================================================
   10.4 INIT TIPE PERJALANAN
====================================================== */
function smartofficeInitTripType(){
    document
        .querySelectorAll(
            "#smartofficeSPDTipeContainer [data-value]"
        )
        .forEach(function(button){
            smartofficeSPDAddHandler(
                button,
                "click",
                function(){
                    /* =========================
                       ACTIVE BUTTON
                    ========================= */
                    document
                        .querySelectorAll(
                            "#smartofficeSPDTipeContainer [data-value]"
                        )
                        .forEach(function(item){
                            item.classList.remove(
                                "active"
                            );
                        });

                    button.classList.add(
                        "active"
                    );

                    /* =========================
                       SIMPAN TIPE
                    ========================= */
                    const hidden =
                        document.getElementById(
                            "smartofficeSPDTipeKeberangkatan"
                        );
                    if(hidden){
                        hidden.value =
                            button.dataset.value || "";
                    }

                    /* =========================
                       HITUNG & RENDER
                    ========================= */
                    smartofficeHitungJumlahHariSPD();
                    smartofficeRenderSPDTimeline();

                    /* =========================
                       LANGSUNG BUKA
                    ========================= */
                    smartofficeOpenSPDJadwal();
                    smartofficeUpdateProgress();
                    smartofficeUpdateSubmitButton();
                }
            );
        });
}

/* ======================================================
   10.5 RENDER DETAIL JADWAL PERJALANAN
====================================================== */
function smartofficeRenderSPDTimeline(){

    const container =
        document.getElementById(
            "smartofficeSPDTimelineContainer"
        );

    const emptyState =
        document.getElementById(
            "smartofficeSPDDetailJadwalEmpty"
        );

    if(!container){
        return;
    }

    /* =========================
       SIMPAN NILAI SEBELUM RENDER
    ========================= */
    const previousValues = {};

    container
        .querySelectorAll("input")
        .forEach(function(input){

            previousValues[input.id] =
                input.value || "";

        });

    container.innerHTML = "";

    if(emptyState){
        emptyState.style.display =
            "none";
    }

    /* =========================
       JUMLAH HARI
    ========================= */
    const jumlahHari =
        smartofficeHitungJumlahHariSPD();

    /* =========================
       TIPE
    ========================= */
    const tipe =
        document.getElementById(
            "smartofficeSPDTipeKeberangkatan"
        )?.value || "";

    /* =========================
       BELUM SIAP
    ========================= */
    if(
        !jumlahHari ||
        !tipe
    ){
        if(emptyState){
            emptyState.textContent =
                !jumlahHari
                    ? "Isi tanggal berangkat dan tanggal pulang terlebih dahulu."
                    : "Pilih tipe perjalanan untuk menampilkan detail jadwal.";

            emptyState.style.display =
                "block";
        }

        return;
    }

    /* =========================
       PULANG PERGI > 3 HARI
    ========================= */
    if(
        tipe === "PULANG_PERGI" &&
        Number(jumlahHari) > 3
    ){

        container.innerHTML = `
            <div class="smartoffice-spd-empty-state">
                Perjalanan Pulang Pergi maksimal 3 hari.
                Silakan sesuaikan tanggal perjalanan.
            </div>
        `;

        smartofficeUpdateSubmitButton();

        return;
    }

    /* =========================
       MENGINAP
       HANYA HARI 1
    ========================= */
    const totalHari =
        tipe === "MENGINAP"
            ? 1
            : Number(jumlahHari);

    /* =========================
       TIMELINE
    ========================= */
    const timeline =
        document.createElement("div");

    timeline.className =
        "smartoffice-spd-timeline";
    for(
        let hari = 1;
        hari <= totalHari;
        hari++
    ){
        const tanggal =
            smartofficeGetScheduleDate(
                hari
            );

        const dayCard =
            document.createElement("div");

        dayCard.className =
            "smartoffice-spd-timeline-day";

        let html = `
            <div class="smartoffice-spd-timeline-day-title">
                <span>
                    Hari ${hari}
                </span>

                <span class="smartoffice-spd-timeline-date">
                    ${smartofficeFormatSPDScheduleDate(tanggal)}
                </span>
            </div>

            <div class="smartoffice-spd-jadwal-grid">
        `;

        /* =========================
           HARI 2 & 3
           PULANG PERGI
        ========================= */
        if(
            tipe === "PULANG_PERGI" &&
            hari >= 2
        ){
            html += `
                <div class="smartoffice-spd-field">
                    <label>Lokasi</label>

                    <input
                        type="text"
                        id="smartofficeSPD_LokasiHari${hari}"
                        maxlength="100"
                        placeholder="Lokasi perjalanan"
                    >
                </div>
            `;
        }

        /* =========================
           BERANGKAT
        ========================= */
        html += `
            <div class="smartoffice-spd-field">
                <label>Berangkat</label>

                <input
                    type="time"
                    id="smartofficeSPD_BerangkatHari${hari}"
                >
            </div>
        `;

        /* =========================
           TIBA
           HARI 2 & 3 PULANG PERGI
        ========================= */
        if(
            tipe === "PULANG_PERGI" &&
            hari >= 2
        ){
            html += `
                <div class="smartoffice-spd-field">
                    <label>Tiba</label>

                    <input
                        type="time"
                        id="smartofficeSPD_TibaHari${hari}"
                    >
                </div>
            `;
        }

        /* =========================
           PULANG
        ========================= */
        html += `
            <div class="smartoffice-spd-field">
                <label>Pulang</label>

                <input
                    type="time"
                    id="smartofficeSPD_PulangHari${hari}"
                >
            </div>
        `;

        html += `
            </div>
        `;
        dayCard.innerHTML =
            html;

        timeline.appendChild(
            dayCard
        );
    }

    container.appendChild(
        timeline
    );

    /* =========================
       KEMBALIKAN NILAI LAMA
    ========================= */
    Object.keys(
        previousValues
    ).forEach(function(id){
        const input =
            document.getElementById(id);
        if(input){
            input.value =
                previousValues[id];
        }
    });

    /* =========================
       UPDATE
    ========================= */
    smartofficeInitRenderedScheduleEvents();
    smartofficeUpdateProgress();
    smartofficeUpdateSubmitButton();
}

/* ======================================================
   10.6 RENDER FIELD WAKTU JADWAL
====================================================== */
function smartofficeRenderTimeField(
    key,
    label,
    id
){
    return `
        <div class="smartoffice-spd-field" data-schedule-key="${key}">
            <label>${label}</label>
            <input
                type="time"
                id="${id}"
            >
        </div>
    `;
}

/* ======================================================
   10.7 INIT EVENT FIELD JADWAL HASIL RENDER
====================================================== */
function smartofficeInitRenderedScheduleEvents(){
    const container =
        document.getElementById(
            "smartofficeSPDTimelineContainer"
        );

    if(!container){
        return;
    }

    container
        .querySelectorAll("input")
        .forEach(function(input){

            smartofficeSPDAddHandler(
                input,
                "change",
                smartofficeUpdateSubmitButton
            );

        });
}

/* ======================================================
   10.8 OBSERVER PERUBAHAN TIMELINE
====================================================== */
function smartofficeInitScheduleObserver(){
    const container =
        document.getElementById(
            "smartofficeSPDTimelineContainer"
        );

    if(!container){
        return;
    }

    const observer =
        new MutationObserver(
            function(){
                smartofficeInitRenderedScheduleEvents();
                smartofficeUpdateProgress();
            }
        );

    observer.observe(
        container,
        {
            childList: true,
            subtree: true
        }
    );

    smartofficeSPDHandlers.set(
        "mutation-observer",
        {
            type: "__observer__",
            callback: observer,
            element: null
        }
    );
}

/* ======================================================
   10.9 AMBIL TANGGAL DETAIL JADWAL
====================================================== */
function smartofficeGetScheduleDate(hari){

    const value =
        document.getElementById(
            "smartofficeSPDTanggalBerangkat"
        )?.value;
    if(!value){
        return null;
    }

    const date =
        new Date(
            value + "T00:00:00"
        );
    date.setDate(
        date.getDate() +
        (
            Number(hari) - 1
        )
    );

    return date;
}

/* ======================================================
   10.10 FORMAT TANGGAL DETAIL JADWAL
====================================================== */
function smartofficeFormatSPDScheduleDate(date){

    if(!date){
        return "";
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(date);
}



/* ================================================================================================
   11. ACCORDION DETAIL JADWAL
================================================================================================ */

/* ======================================================
   11.1 BUKA DETAIL JADWAL
====================================================== */
function smartofficeOpenSPDJadwal(){

    const accordion =
        document.querySelector(
            ".smartoffice-spd-accordion"
        );

    const body =
        document.getElementById(
            "smartofficeSPDDetailJadwal"
        );

    const icon =
        document.getElementById(
            "smartofficeSPDJadwalIcon"
        );
    if(
        !accordion ||
        !body
    ){
        return;
    }

    accordion.classList.add(
        "active"
    );

    body.style.display =
        "block";

    if(icon){
        icon.classList.add(
            "open"
        );
    }
}

/* ======================================================
   11.2 TUTUP DETAIL JADWAL
====================================================== */
function smartofficeCloseSPDJadwal(){

    const accordion =
        document.querySelector(
            ".smartoffice-spd-accordion"
        );

    const body =
        document.getElementById(
            "smartofficeSPDDetailJadwal"
        );

    const icon =
        document.getElementById(
            "smartofficeSPDJadwalIcon"
        );
    if(
        !accordion ||
        !body
    ){
        return;
    }

    accordion.classList.remove(
        "active"
    );

    body.style.display =
        "none";

    if(icon){
        icon.classList.remove(
            "open"
        );
    }
}

/* ======================================================
   11.3 TOGGLE DETAIL JADWAL
====================================================== */
function smartofficeToggleSPDJadwal(){

    const accordion =
        document.querySelector(
            ".smartoffice-spd-accordion"
        );

    if(!accordion){
        return;
    }
    if(
        accordion.classList.contains(
            "active"
        )
    ){

        smartofficeCloseSPDJadwal();
    }
    else{

        smartofficeOpenSPDJadwal();
    }
}



/* ================================================================================================
   12. PROGRESS FORM
================================================================================================ */

/* ======================================================
   12.1 INIT PROGRESS
====================================================== */
function smartofficeInitProgress(){
    smartofficeUpdateProgress();
    smartofficeInitScheduleObserver();
}

/* ======================================================
   12.2 UPDATE PROGRESS
====================================================== */
function smartofficeUpdateProgress(){
    const checks = [
        document.getElementById("smartofficeSPDNama")?.value,
        document.getElementById("smartofficeSPDNip")?.value,
        document.getElementById("smartofficeSPDAlatAngkut")?.value,
        document.getElementById("smartofficeSPDKegiatan")?.value,
        document.getElementById("smartofficeSPDLokasi")?.value,
        document.getElementById("smartofficeSPDTanggalSPD")?.value,
        document.getElementById("smartofficeSPDTanggalBerangkat")?.value,
        document.getElementById("smartofficeSPDTanggalPulang")?.value,
        document.getElementById("smartofficeSPDTipeKeberangkatan")?.value,
        document.getElementById("smartofficeSPDConfirm")?.checked
    ];

    let filled = 0;

    checks.forEach(function(value){
        if(value === true || String(value || "").trim() !== ""){
            filled++;
        }
    });

    const percent =
        Math.round(
            (filled / checks.length) * 100
        );

    const percentElement =
        document.getElementById(
            "smartofficeSPDProgressPercent"
        );

    const fillElement =
        document.getElementById(
            "smartofficeSPDProgressFill"
        );

    if(percentElement){
        percentElement.textContent =
            `${percent}%`;
    }

    if(fillElement){
        fillElement.style.width =
            `${percent}%`;
    }
}



/* ================================================================================================
   13. LAMPIRAN
================================================================================================ */

/* ======================================================
   13.1 INIT FILE UPLOAD
====================================================== */
function smartofficeInitFileUpload(){

    const input =
        document.getElementById(
            "smartofficeSPDLampiran"
        );

    const fileNameElement =
        document.getElementById(
            "smartofficeSPDLampiranName"
        );

    if(!input){
        return;
    }

    smartofficeSPDAddHandler(
        input,
        "change",
        function(){

            const file =
                input.files?.[0] || null;

            smartofficeSPDFile = file;

            if(fileNameElement){
                fileNameElement.textContent =
                    file
                        ? file.name
                        : "Belum ada file dipilih";
            }

            if(file && file.size > 5 * 1024 * 1024){

                smartofficeShowToast(
                    "Ukuran lampiran maksimal 5 MB.",
                    "error"
                );

                input.value = "";
                smartofficeSPDFile = null;

                if(fileNameElement){
                    fileNameElement.textContent =
                        "Belum ada file dipilih";
                }
            }

            smartofficeUpdateProgress();
        }
    );
}



/* ================================================================================================
   14. VALIDASI & SUBMIT SPD
================================================================================================ */

/* ======================================================
   14.1 UPDATE STATUS TOMBOL SUBMIT
====================================================== */
function smartofficeUpdateSubmitButton(){

    const button =
        document.getElementById(
            "smartofficeSPDSubmitButton"
        );

    if(!button){
        return;
    }

    const valid =
        Boolean(
            document.getElementById("smartofficeSPDNama")?.value.trim() &&
            document.getElementById("smartofficeSPDNip")?.value.trim() &&
            document.getElementById("smartofficeSPDAlatAngkut")?.value.trim() &&
            document.getElementById("smartofficeSPDKegiatan")?.value.trim() &&
            document.getElementById("smartofficeSPDLokasi")?.value.trim() &&
            document.getElementById("smartofficeSPDTanggalSPD")?.value.trim() &&
            document.getElementById("smartofficeSPDTanggalBerangkat")?.value.trim() &&
            document.getElementById("smartofficeSPDTanggalPulang")?.value.trim() &&
            document.getElementById("smartofficeSPDTipeKeberangkatan")?.value.trim() &&
            document.getElementById("smartofficeSPDConfirm")?.checked
        );
    button.disabled =
        !valid || smartofficeSubmitting;

    button.classList.toggle(
        "loading",
        smartofficeSubmitting
    );
}

/* ======================================================
   14.2 INIT TOMBOL SUBMIT
====================================================== */
function smartofficeInitSubmitButton(){

    const button =
        document.getElementById(
            "smartofficeSPDSubmitButton"
        );

    smartofficeSPDAddHandler(
        button,
        "click",
        smartofficeHandleSubmitSPD
    );

    const ids = [
        "smartofficeSPDAlatAngkut",
        "smartofficeSPDKegiatan",
        "smartofficeSPDLokasi",
        "smartofficeSPDConfirm"
    ];

    ids.forEach(function(id){
        const element =
            document.getElementById(id);

        smartofficeSPDAddHandler(
            element,
            "input",
            function(){
                smartofficeUpdateProgress();
                smartofficeUpdateSubmitButton();
            }
        );

        smartofficeSPDAddHandler(
            element,
            "change",
            function(){
                smartofficeUpdateProgress();
                smartofficeUpdateSubmitButton();
            }
        );
    });
}

/* ======================================================
   14.3 PROSES SUBMIT SPD
====================================================== */
async function smartofficeHandleSubmitSPD(){

    if(smartofficeSubmitting){
        return;
    }

    smartofficeSubmitting = true;
    smartofficeUpdateSubmitButton();

    try{
        const data =
            await smartofficeBuildSubmitPayload();

        const response =
            await smartofficeSubmitSPD(data);

        if(!response || !response.success){
            throw new Error(
                response?.message ||
                "SPD gagal disimpan."
            );
        }

        smartofficeShowToast(
            response.message ||
            "SPD berhasil disimpan.",
            "success"
        );

        smartofficeResetSPDForm();
        smartofficeSwitchSPDTab("riwayat");
    }
    catch(error){
        console.error(
            "SMARTSPD BLUD SUBMIT ERROR:",
            error
        );

        smartofficeShowToast(
            error.message ||
            "SPD gagal disimpan.",
            "error"
        );
    }
    finally{
        smartofficeSubmitting = false;
        smartofficeUpdateSubmitButton();
    }
}

/* ======================================================
   14.4 BUILD PAYLOAD SUBMIT SPD
====================================================== */
async function smartofficeBuildSubmitPayload(){

    let lampiranBase64 = "";
    let lampiranMimeType = "";
    let lampiranFileName = "";

    if(smartofficeSPDFile){
        lampiranBase64 =
            await smartofficeConvertFileToBase64(
                smartofficeSPDFile
            );

        lampiranMimeType =
            smartofficeSPDFile.type ||
            "application/pdf";

        lampiranFileName =
            smartofficeSPDFile.name ||
            "lampiran";
    }

    const payload = {
        nama:
            document.getElementById(
                "smartofficeSPDNama"
            )?.value.trim() || "",

        nip:
            document.getElementById(
                "smartofficeSPDNip"
            )?.value.trim() || "",

        pangkat:
            document.getElementById(
                "smartofficeSPDPangkat"
            )?.value.trim() || "",

        jabatan:
            document.getElementById(
                "smartofficeSPDJabatan"
            )?.value.trim() || "",

        email:
            document.getElementById(
                "smartofficeSPDEmail"
            )?.value.trim() || "",

        noWa:
            document.getElementById(
                "smartofficeSPDNoWA"
            )?.value.trim() || "",

        alatAngkut:
            document.getElementById(
                "smartofficeSPDAlatAngkut"
            )?.value || "",

        kegiatan:
            document.getElementById(
                "smartofficeSPDKegiatan"
            )?.value.trim() || "",

        lokasi:
            document.getElementById(
                "smartofficeSPDLokasi"
            )?.value.trim() || "",

        tanggalSPD:
            document.getElementById(
                "smartofficeSPDTanggalSPD"
            )?.value || "",

        tanggalBerangkat:
            document.getElementById(
                "smartofficeSPDTanggalBerangkat"
            )?.value || "",

        tanggalPulang:
            document.getElementById(
                "smartofficeSPDTanggalPulang"
            )?.value || "",

        tipeKeberangkatan:
            document.getElementById(
                "smartofficeSPDTipeKeberangkatan"
            )?.value || "",

        lampiranBase64,
        lampiranMimeType,
        lampiranFileName
    };

    /* ==================================================
       DETAIL JADWAL
       Q–Z / HARI 1–3
    ================================================== */
    for(let hari = 1; hari <= 3; hari++){

        payload[
            `berangkatHari${hari}`
        ] =
            document.getElementById(
                `smartofficeSPD_BerangkatHari${hari}`
            )?.value || "";

        payload[
            `pulangHari${hari}`
        ] =
            document.getElementById(
                `smartofficeSPD_PulangHari${hari}`
            )?.value || "";

        if(hari >= 2){

            payload[
                `lokasiHari${hari}`
            ] =
                document.getElementById(
                    `smartofficeSPD_LokasiHari${hari}`
                )?.value.trim() || "";

            payload[
                `tibaHari${hari}`
            ] =
                document.getElementById(
                    `smartofficeSPD_TibaHari${hari}`
                )?.value || "";
        }
    }

    /* ==================================================
       DATA PENGIKUT
    ================================================== */
    document
        .querySelectorAll(
            ".smartoffice-spd-pengikut-item"
        )
        .forEach(function(card,index){

            const nomor =
                index + 1;

            payload[
                `pengikut${nomor}Nama`
            ] =
                card.querySelector(
                    ".smartoffice-spd-pengikut-nama"
                )?.value.trim() || "";

            payload[
                `pengikut${nomor}Nip`
            ] =
                card.querySelector(
                    ".smartoffice-spd-pengikut-nip"
                )?.value.trim() || "";

            payload[
                `pengikut${nomor}Lahir`
            ] =
                card.querySelector(
                    ".smartoffice-spd-pengikut-tgllahir"
                )?.value.trim() || "";

            payload[
                `pengikut${nomor}NoWa`
            ] =
                card.querySelector(
                    ".smartoffice-spd-pengikut-no-wa"
                )?.value.trim() || "";
        });

    return payload;
}



/* ================================================================================================
   15. RESET FORM SPD
================================================================================================ */

/* ======================================================
   15.1 RESET SELURUH FORM SPD
====================================================== */
function smartofficeResetSPDForm(){

    const formIds = [
        "smartofficeSPDAlatAngkut",
        "smartofficeSPDKegiatan",
        "smartofficeSPDLokasi",
        "smartofficeSPDTanggalSPD",
        "smartofficeSPDTanggalBerangkat",
        "smartofficeSPDTanggalPulang",
        "smartofficeSPDJumlahHari",
        "smartofficeSPDTipeKeberangkatan",
        "smartofficeSPDConfirm"
    ];

    formIds.forEach(function(id){
        const element =
            document.getElementById(id);

        if(!element){
            return;
        }

        if(element.type === "checkbox"){
            element.checked = false;
        }
        else{
            element.value = "";
        }
    });

    document
        .querySelectorAll(
            "#smartofficeSPDTipeContainer [data-value]"
        )
        .forEach(function(button){
            button.classList.remove("active");
        });

    smartofficeSPDFile = null;

    const fileInput =
        document.getElementById(
            "smartofficeSPDLampiran"
        );

    if(fileInput){
        fileInput.value = "";
    }

    const fileNameElement =
        document.getElementById(
            "smartofficeSPDLampiranName"
        );

    if(fileNameElement){
        fileNameElement.textContent =
            "Belum ada file dipilih";
    }

    const companionContainer =
        document.getElementById(
            "smartofficeSPDPengikutContainer"
        );

    if(companionContainer){
        companionContainer.innerHTML = "";
    }

    smartofficeSPDJumlahPengikut = 0;

    const timeline =
        document.getElementById(
            "smartofficeSPDTimelineContainer"
        );

    if(timeline){
        timeline.innerHTML = "";
    }

    smartofficeUpdateButtonTambahPengikut();
    smartofficeUpdateProgress();
}



/* ================================================================================================
   16. RIWAYAT SPD
================================================================================================ */

/* ======================================================
   16.1 FILTER RIWAYAT BERDASARKAN STATUS
====================================================== */
export function smartofficeFilterRiwayatSPD(
    status,
    activeButton
){

    document
        .querySelectorAll(
            ".smartoffice-spd-riwayat-filter-item"
        )
        .forEach(function(button){
            button.classList.remove("active");
        });

    if(activeButton){
        activeButton.classList.add("active");
    }

    const list =
        document.getElementById(
            "smartofficeRiwayatSPDList"
        );

    if(!list){
        return;
    }

    const filtered =
        status === "SEMUA"
            ? smartofficeSPDRiwayat
            : smartofficeSPDRiwayat.filter(
                item =>
                    String(item.statusSPD || "") === status
            );

    if(!filtered.length){
        list.innerHTML = `
            <div class="smartoffice-spd-riwayat-empty">
                Belum ada data riwayat SPD.
            </div>
        `;
        return;
    }

    smartofficeRenderRiwayatSPDList(
        filtered
    );
}

/* ======================================================
   16.2 RENDER DAFTAR RIWAYAT SPD
====================================================== */
function smartofficeRenderRiwayatSPDList(data){

    const list =
        document.getElementById(
            "smartofficeRiwayatSPDList"
        );

    if(!list){
        return;
    }
    list.innerHTML =
        data.map(function(item){
            return `
                <div class="smartoffice-spd-riwayat-card">
                    <div class="smartoffice-spd-riwayat-header">
                        <div>
                            <strong>${smartofficeEscapeHtml(item.idSPD || "-")}</strong>
                            <div class="smartoffice-spd-riwayat-date">
                                ${smartofficeEscapeHtml(item.tanggalBerangkat || "-")}
                            </div>
                        </div>
                        <span class="smartoffice-spd-riwayat-status">
                            ${smartofficeEscapeHtml(item.statusSPD || "-")}
                        </span>
                    </div>

                    <div class="smartoffice-spd-riwayat-body">
                        <div class="smartoffice-spd-riwayat-main">
                            <strong>${smartofficeEscapeHtml(item.kegiatan || "-")}</strong>
                            <span>${smartofficeEscapeHtml(item.lokasi || "-")}</span>
                        </div>
                    </div>

                    <div class="smartoffice-spd-riwayat-footer">
                        <span>${smartofficeEscapeHtml(item.nama || "-")}</span>
                        ${item.linkPdf
                            ? `<a class="smartoffice-spd-riwayat-detail" href="${smartofficeSafeUrl(item.linkPdf)}" target="_blank" rel="noopener">Lihat PDF</a>`
                            : ""
                        }
                    </div>
                </div>
            `;
        })
        .join("");
}

/* ======================================================
   16.3 TAMPILKAN STATUS RIWAYAT BELUM TERSEDIA
====================================================== */
function smartofficeRenderRiwayatSPDUnavailable(){

    const list =
        document.getElementById(
            "smartofficeRiwayatSPDList"
        );

    if(!list){
        return;
    }
    list.innerHTML = `
        <div class="smartoffice-spd-riwayat-empty">
            Riwayat SPD akan dimuat dari Firestore setelah collection mirror SmartSPD BLUD terhubung.
        </div>
    `;

    smartofficeUpdateSPDStats();
}

/* ======================================================
   16.4 UPDATE MINI STAT SPD
====================================================== */
function smartofficeUpdateSPDStats(){
    const total =
        smartofficeSPDRiwayat.length;

    const menunggu =
        smartofficeSPDRiwayat.filter(
            item => item.statusSPD === "MENUNGGU REVIEW"
        ).length;

    const disetujui =
        smartofficeSPDRiwayat.filter(
            item => item.statusSPD === "DISETUJUI"
        ).length;

    const elements = [
        ["smartofficeStatTotalSPD", total],
        ["smartofficeStatSPDMenunggu", menunggu],
        ["smartofficeStatSPDDisetujui", disetujui]
    ];
    elements.forEach(function(item){
        const element =
            document.getElementById(item[0]);
        if(element){
            element.textContent =
                String(item[1]);
        }
    });
}



/* ================================================================================================
   17. GLOBAL AUTOCOMPLETE
================================================================================================ */

/* ======================================================
   17.1 INIT CLICK OUTSIDE AUTOCOMPLETE
====================================================== */
function smartofficeInitOutsideAutocomplete(){

    const handler =
        function(event){

            if(!event.target.closest(
                ".smartoffice-spd-autocomplete-wrapper"
            )){
                smartofficeCloseAllPengikutAutocomplete();

                const resultBox =
                    document.getElementById(
                        "smartofficeSPDNamaAutocomplete"
                    );

                if(resultBox){
                    resultBox.innerHTML = "";
                }
            }
        };

    smartofficeSPDAddHandler(
        document,
        "click",
        handler
    );
}



/* ================================================================================================
   18. HELPER
================================================================================================ */

/* ======================================================
   18.1 ESCAPE HTML
====================================================== */
function smartofficeEscapeHtml(value){

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* ======================================================
   18.2 VALIDASI / NORMALISASI URL
====================================================== */
function smartofficeSafeUrl(value){
    try{
        const url =
            new URL(
                String(value || ""),
                window.location.origin
            );
        if(
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ){
            return "#";
        }

        return url.href;
    }
    catch(error){
        return "#";
    }
}


