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

import {
    smartofficeGetAllSPDFromFirestore
} from "../../services/smartspd-blud-firestore.service.js";

/* ======================================================
   1.4 UTILS
====================================================== */
import {
    smartofficeConvertFileToBase64
} from "../../utils/file.js";



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

/* ======================================================
   2.7 ACTION MENU
====================================================== */
let smartofficeSPDActionMenuElement = null;

/* ======================================================
   2.8 MODE EDIT
====================================================== */
let smartofficeSPDEditMode = false;
let smartofficeSPDEditId = "";
let smartofficeSPDEditItem = null;


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

    await smartofficeLoadRiwayatSPD();
    smartofficeInitRiwayatSPDFilter();
    smartofficeInitSPDActionMenu();
    smartofficeInitSPDActionMenuGlobalEvents();
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
                    smartofficeFormatTanggalLahirPengikut(
                        item.tanggalLahir
                    );

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
                /* =========================
                   VALIDASI HARI MINGGU
                ========================= */
                smartofficeValidateDateSunday(
                    input
                );

                /* =========================
                   VALIDASI URUTAN TANGGAL
                ========================= */
                const tanggalValid =
                    smartofficeValidateSPDDateRange(
                        input
                    );

                if(!tanggalValid){
                    const jumlahHari =
                        document.getElementById(
                            "smartofficeSPDJumlahHari"
                        );
                    if(jumlahHari){
                        jumlahHari.value = "";
                    }

                    smartofficeRenderSPDTimeline();
                    smartofficeUpdateProgress();
                    smartofficeUpdateSubmitButton();

                    return;
                }

                /* =========================
                HITUNG JUMLAH HARI
                ========================= */
                smartofficeHitungJumlahHariSPD();

                /* =========================
                KUNCI TIPE JIKA 1 HARI
                ========================= */
                smartofficeUpdateTripTypeLock();

                /* =========================
                RENDER DETAIL
                ========================= */
                smartofficeRenderSPDTimeline();

                /* =========================
                BUKA OTOMATIS JIKA 1 HARI
                ========================= */
                const jumlahHari =
                    Number(
                        document.getElementById(
                            "smartofficeSPDJumlahHari"
                        )?.value || 0
                    );
                if(jumlahHari === 1){
                    smartofficeOpenSPDJadwal();
                }

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
   10.3 VALIDASI URUTAN TANGGAL SPD
        SPD DIBUAT <= BERANGKAT <= PULANG
====================================================== */
function smartofficeValidateSPDDateRange(changedInput){

    const tanggalSPD =
        document.getElementById(
            "smartofficeSPDTanggalSPD"
        );

    const tanggalBerangkat =
        document.getElementById(
            "smartofficeSPDTanggalBerangkat"
        );

    const tanggalPulang =
        document.getElementById(
            "smartofficeSPDTanggalPulang"
        );

    if(
        !tanggalSPD ||
        !tanggalBerangkat ||
        !tanggalPulang
    ){
        return true;
    }

    /* =========================
       SPD DIBUAT
       HARUS <= BERANGKAT
    ========================= */
    if(
        tanggalSPD.value &&
        tanggalBerangkat.value &&
        tanggalSPD.value >
        tanggalBerangkat.value
    ){
        changedInput.value = "";

        smartofficeShowToast(
            "Tanggal SPD dibuat tidak boleh melebihi tanggal berangkat.",
            "error"
        );

        return false;
    }

    /* =========================
       BERANGKAT
       HARUS <= PULANG
    ========================= */
    if(
        tanggalBerangkat.value &&
        tanggalPulang.value &&
        tanggalBerangkat.value >
        tanggalPulang.value
    ){
        changedInput.value = "";

        smartofficeShowToast(
            "Tanggal berangkat tidak boleh melebihi tanggal pulang.",
            "error"
        );

        return false;
    }

    /* =========================
       SEMUA VALID
    ========================= */
    return true;
}

/* ======================================================
   10.4 HITUNG JUMLAH HARI SPD
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
   10.5 KUNCI TIPE PERJALANAN UNTUK 1 HARI
====================================================== */
function smartofficeUpdateTripTypeLock(){

    const jumlahHari =
        Number(
            document.getElementById(
                "smartofficeSPDJumlahHari"
            )?.value || 0
        );

    const pulangPergi =
        document.querySelector(
            '#smartofficeSPDTipeContainer [data-value="PULANG_PERGI"]'
        );

    const menginap =
        document.querySelector(
            '#smartofficeSPDTipeContainer [data-value="MENGINAP"]'
        );

    const hidden =
        document.getElementById(
            "smartofficeSPDTipeKeberangkatan"
        );

    /* =========================
       1 HARI
    ========================= */
    if(jumlahHari === 1){

        /* Kunci Pulang Pergi */
        if(pulangPergi){
            pulangPergi.classList.add("active");
            pulangPergi.disabled = true;
            pulangPergi.setAttribute(
                "aria-pressed",
                "true"
            );
        }

        /* Nonaktifkan Menginap */
        if(menginap){
            menginap.disabled = true;
            menginap.classList.remove("active");
            menginap.setAttribute(
                "aria-disabled",
                "true"
            );
        }

        /* Paksa tipe menjadi Pulang Pergi */
        if(hidden){
            hidden.value =
                "PULANG_PERGI";
        }

        return;
    }

    /* =========================
       LEBIH DARI 1 HARI
    ========================= */

    if(pulangPergi){
        pulangPergi.disabled = false;
        pulangPergi.removeAttribute(
            "aria-pressed"
        );
    }

    if(menginap){
        menginap.disabled = false;
        menginap.removeAttribute(
            "aria-disabled"
        );
    }
}

/* ======================================================
   10.6 INIT TIPE PERJALANAN
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

    /* ==================================================
       CEK KONDISI AWAL
    ================================================== */
    smartofficeUpdateTripTypeLock();
}

/* ======================================================
   10.7 RENDER DETAIL JADWAL PERJALANAN
        DETAIL OTOMATIS DARI TANGGAL SPD
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

    container.innerHTML = "";

    if(emptyState){
        emptyState.style.display = "none";
    }

    /* =========================
       JUMLAH HARI
    ========================= */
    const jumlahHari =
        smartofficeHitungJumlahHariSPD();

    /* =========================
       TIPE PERJALANAN
    ========================= */
    const tipe =
        document.getElementById(
            "smartofficeSPDTipeKeberangkatan"
        )?.value || "";

    /* =========================
       BELUM LENGKAP
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
       PULANG PERGI MAX 3 HARI
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

        return;
    }

    /* ==================================================
       MENGINAP
       TAMPILKAN RANGE TANGGAL DALAM 1 CARD
    ================================================== */
    if(tipe === "MENGINAP"){

        const tanggalAwal =
            smartofficeGetScheduleDate(1);

        const tanggalAkhir =
            smartofficeGetScheduleDate(
                Number(jumlahHari)
            );

        const tanggalAwalText =
            smartofficeFormatSPDScheduleDate(
                tanggalAwal
            );

        const tanggalAkhirText =
            smartofficeFormatSPDScheduleDate(
                tanggalAkhir
            );

        const rangeHari =
            Number(jumlahHari) > 1
                ? `Hari 1 - ${jumlahHari}`
                : "Hari 1";

        const rangeTanggal =
            Number(jumlahHari) > 1
                ? `${tanggalAwalText} - ${tanggalAkhirText}`
                : tanggalAwalText;

        const dayCard =
            document.createElement("div");

        dayCard.className =
            "smartoffice-spd-timeline-day";

        dayCard.innerHTML = `

            <div class="smartoffice-spd-timeline-day-title">
                <span>
                    ${rangeHari}
                </span>

                <span class="smartoffice-spd-timeline-date">
                    ${rangeTanggal}
                </span>
            </div>

            <div class="smartoffice-spd-jadwal-grid">
                <div class="smartoffice-spd-field">
                    <label>
                        Berangkat
                    </label>

                    <input
                        type="text"
                        id="smartofficeSPD_BerangkatHari1"
                        value="${tanggalAwalText}"
                        readonly
                    >
                </div>

                <div class="smartoffice-spd-field">
                    <label>
                        Pulang
                    </label>

                    <input
                        type="text"
                        id="smartofficeSPD_PulangHari1"
                        value="${tanggalAkhirText}"
                        readonly
                    >
                </div>
            </div>
        `;

        container.appendChild(
            dayCard
        );

        smartofficeUpdateProgress();
        smartofficeUpdateSubmitButton();

        return;
    }

    /* =========================
       TIMELINE PULANG PERGI
    ========================= */
    const totalHari =
        Number(jumlahHari);

    /* =========================
       AMBIL LOKASI TUJUAN
    ========================= */
    const lokasiTujuan =
        document.getElementById(
            "smartofficeSPDLokasi"
        )?.value.trim() || "";

    /* =========================
       ASAL / KEMBALI
       SEMENTARA PUSKESMAS NAMBO
    ========================= */
    const lokasiKembali =
        "Puskesmas Nambo";

    /* =========================
       TIMELINE
    ========================= */
    const timeline =
        document.createElement(
            "div"
        );

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

        const tanggalText =
            smartofficeFormatSPDScheduleDate(
                tanggal
            );

        const dayCard =
            document.createElement(
                "div"
            );

        dayCard.className =
            "smartoffice-spd-timeline-day";

        let html = `
            <div class="smartoffice-spd-timeline-day-title">
                ${
                    jumlahHari === 1
                        ? tanggalText
                        : `Hari ${hari} : ${tanggalText}`
                }
            </div>

            <div class="smartoffice-spd-jadwal-grid">
        `;

        /* ==================================================
           HARI 1
           JIKA 1 HARI → LABEL CUKUP BERANGKAT / PULANG
        ================================================== */
        if(hari === 1){
            html += `
                <div class="smartoffice-spd-field">
                    <label>
                        ${
                            jumlahHari === 1
                                ? "Berangkat"
                                : "Berangkat Hari 1"
                        }
                    </label>

                    <input
                        type="text"
                        id="smartofficeSPD_BerangkatHari1"
                        value="${tanggalText}"
                        readonly
                    >
                </div>

                <div class="smartoffice-spd-field">
                    <label>
                        ${
                            jumlahHari === 1
                                ? "Pulang"
                                : "Pulang Hari 1"
                        }
                    </label>

                    <input
                        type="text"
                        id="smartofficeSPD_PulangHari1"
                        value="${tanggalText}"
                        readonly
                    >
                </div>
            `;
        }

        /* ==================================================
           HARI 2 & 3
           PULANG PERGI
        ================================================== */
        if(
            hari >= 2 &&
            tipe === "PULANG_PERGI"
        ){
            html += `
                <div class="smartoffice-spd-field">
                    <label>
                        Berangkat Hari ${hari}
                    </label>

                    <input
                        type="text"
                        id="smartofficeSPD_BerangkatHari${hari}"
                        value="${tanggalText}"
                        readonly
                    >
                </div>

                <div class="smartoffice-spd-field">
                    <label>
                        Pulang Hari ${hari}
                    </label>

                    <input
                        type="text"
                        id="smartofficeSPD_PulangHari${hari}"
                        value="${tanggalText}"
                        readonly
                    >
                </div>

                <div class="smartoffice-spd-field">
                    <label>
                        Lokasi Hari ${hari}
                    </label>

                    <input
                        type="text"
                        id="smartofficeSPD_LokasiHari${hari}"
                        value="${smartofficeEscapeHtml(lokasiTujuan)}"
                        readonly
                    >
               </div>

                <div class="smartoffice-spd-field">
                    <label>
                        Tiba Hari ${hari}
                    </label>

                    <input
                        type="text"
                        id="smartofficeSPD_TibaHari${hari}"
                        value="${smartofficeEscapeHtml(lokasiKembali)}"
                        readonly
                    >
                </div>
            `;
        }

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

    smartofficeUpdateProgress();
    smartofficeUpdateSubmitButton();
}


/* ======================================================
   10.8 RENDER FIELD WAKTU JADWAL
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
   10.9 INIT EVENT FIELD JADWAL HASIL RENDER
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
   10.10 OBSERVER PERUBAHAN TIMELINE
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
   10.11 AMBIL TANGGAL DETAIL JADWAL
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
   10.12 FORMAT TANGGAL DETAIL JADWAL
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

/* ======================================================
   10.13 FORMAT TANGGAL LAHIR PENGIKUT
         FIRESTORE : M/D/YYYY
         DISPLAY   : DD/MM/YYYY
====================================================== */
function smartofficeFormatTanggalLahirPengikut(
    tanggal
){

    if(!tanggal){
        return "";
    }

    const value =
        String(tanggal).trim();

    const match =
        value.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );

    if(!match){
        return value;
    }

    const bulan =
        String(
            Number(match[1])
        ).padStart(2,"0");

    const hari =
        String(
            Number(match[2])
        ).padStart(2,"0");

    const tahun =
        match[3];

    return `${hari}/${bulan}/${tahun}`;
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

            if(file && file.size > 2 * 1024 * 1024){

                smartofficeShowToast(
                    "Ukuran lampiran maksimal 2 MB.",
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
        !valid ||
        smartofficeSubmitting;

    button.classList.toggle(
        "loading",
        smartofficeSubmitting
    );

    const submitText =
        button.querySelector(
            ".smartoffice-spd-submit-text"
        );
    if(submitText){
        if(smartofficeSubmitting){
            submitText.textContent =
                smartofficeSPDEditMode
                    ? "Menyimpan..."
                    : "Mengajukan...";

        }
        else{
            submitText.textContent =
                smartofficeSPDEditMode
                    ? "Simpan Perubahan"
                    : "Ajukan SPD";
        }
    }
}

/* ======================================================
   14.2 COUNTER LOKASI
====================================================== */
function smartofficeUpdateLokasiCounter(){

    const input =
        document.getElementById(
            "smartofficeSPDLokasi"
        );

    const counter =
        document.getElementById(
            "smartofficeSPDLokasiCounter"
        );

    if(!input || !counter){
        return;
    }

    counter.textContent =
        input.value.length;
}

/* ======================================================
   14.3 INIT TOMBOL SUBMIT
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

    /* ==================================================
       COUNTER LOKASI
    ================================================== */
    const lokasi =
        document.getElementById(
            "smartofficeSPDLokasi"
        );

    smartofficeSPDAddHandler(
        lokasi,
        "input",
        function(){
            smartofficeUpdateLokasiCounter();
        }
    );

    // Set nilai awal
    smartofficeUpdateLokasiCounter();
}

/* ======================================================
   14.4 PROSES SUBMIT SPD
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

        console.log(
            "SMARTSPD PAYLOAD:",
            data
        );

        const response =
            smartofficeSPDEditMode
                ? await smartofficeUpdateSPD(data)
                : await smartofficeSubmitSPD(data);

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
   14.5 BUILD PAYLOAD SUBMIT / UPDATE SPD
====================================================== */
async function smartofficeBuildSubmitPayload(){

    let lampiranBase64 = "";
    let lampiranMimeType = "";
    let lampiranFileName = "";

    /* ==================================================
       LAMPIRAN
    ================================================== */
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

    /* ==================================================
       PAYLOAD UTAMA
    ================================================== */
    const payload = {

        /* ==================================================
           ID SPD
           KOSONG SAAT SUBMIT BARU
           TERISI SAAT EDIT
        ================================================== */
        idSPD:
            smartofficeSPDEditMode
                ? smartofficeSPDEditId
                : "",

        /* ==================================================
           DATA PEGAWAI
        ================================================== */
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

        /* ==================================================
           DETAIL PERJALANAN
        ================================================== */
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

        /* ==================================================
           TANGGAL SPD
        ================================================== */
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

        /* ==================================================
           TIPE KEBERANGKATAN
        ================================================== */
        tipeKeberangkatan:
            document.getElementById(
                "smartofficeSPDTipeKeberangkatan"
            )?.value || "",

        /* ==================================================
           JENIS PERJALANAN DINAS
           BISA DIUBAH SAAT EDIT
        ================================================== */
        jenisPerjalananDinas:
            smartofficeSPDEditMode &&
            smartofficeSPDEditItem
                ? String(
                    smartofficeSPDEditItem.raw?.[
                        "JENIS_PERJALANAN_DINAS"
                    ] || ""
                ).trim()
                : "",

        /* ==================================================
           LAMPIRAN
        ================================================== */
        lampiranBase64:
            lampiranBase64,

        lampiranMimeType:
            lampiranMimeType,

        lampiranFileName:
            lampiranFileName
    };

    /* ==================================================
       DETAIL JADWAL PERJALANAN
       HARI 1 - 3
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

        /* ==================================================
           HARI 2 DAN HARI 3
           ADA LOKASI + TIBA
        ================================================== */
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

            /* ==================================================
               NAMA PENGIKUT
            ================================================== */
            payload[
                `pengikut${nomor}Nama`
            ] =
                card.querySelector(
                    ".smartoffice-spd-pengikut-nama"
                )?.value.trim() || "";

            /* ==================================================
               NIP / NRP PENGIKUT
            ================================================== */
            payload[
                `pengikut${nomor}Nip`
            ] =
                card.querySelector(
                    ".smartoffice-spd-pengikut-nip"
                )?.value.trim() || "";

            /* ==================================================
               TANGGAL LAHIR PENGIKUT
            ================================================== */
            payload[
                `pengikut${nomor}Lahir`
            ] =
                card.querySelector(
                    ".smartoffice-spd-pengikut-tgllahir"
                )?.value.trim() || "";

            /* ==================================================
               NO WA PENGIKUT
            ================================================== */
            payload[
                `pengikut${nomor}NoWa`
            ] =
                card.querySelector(
                    ".smartoffice-spd-pengikut-no-wa"
                )?.value.trim() || "";
        });

    /* ==================================================
       DEBUG
    ================================================== */
    console.log(
        "SMARTSPD BUILD PAYLOAD:",
        payload
    );

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

    /* ==================================================
       EMPTY
    ================================================== */
    if(!Array.isArray(data) || !data.length){
        list.innerHTML = `
            <div class="smartoffice-spd-riwayat-empty">
                <div class="smartoffice-spd-riwayat-empty-icon">
                    <svg
                        viewBox="0 0 24 24"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <path d="M14 2v6h6"/>
                        <path d="M8 13h8"/>
                        <path d="M8 17h5"/>
                    </svg>
                </div>

                <strong>
                    Belum ada data riwayat SPD
                </strong>

                <span>
                    Data SPD yang sesuai dengan filter akan tampil di sini.
                </span>
            </div>
        `;

        return;
    }

    /* ==================================================
       CARD
    ================================================== */
    list.innerHTML =
        data.map(function(item){

            /* ------------------------------------------
               PENGIKUT
            ------------------------------------------ */
            const pengikut =
                Array.isArray(item.pengikut)
                    ? item.pengikut.filter(function(nama){
                        return String(nama || "").trim();
                    })
                    : [];

            /* ------------------------------------------
               JUMLAH HARI
            ------------------------------------------ */
            const jumlahHari =
                item.jumlahHari !== null &&
                item.jumlahHari !== undefined &&
                String(item.jumlahHari).trim() !== ""
                    ? String(item.jumlahHari) + " Hari"
                    : "-";

            /* ------------------------------------------
               STATUS SPD
            ------------------------------------------ */
            const statusSPD =
                String(
                    item.statusSPD || "-"
                ).trim();

            let statusClass =
                "default";

            if(statusSPD === "MENUNGGU REVIEW"){
                statusClass = "waiting";
            }
            else if(statusSPD === "DISETUJUI"){
                statusClass = "approved";
            }
            else if(statusSPD === "DITOLAK"){
                statusClass = "rejected";
            }
            else if(statusSPD === "REVISI"){
                statusClass = "revision";
            }

            /* ------------------------------------------
               STATUS SPJ
            ------------------------------------------ */
            const statusSPJ =
                String(
                    item.statusSPJ || "BELUM ADA"
                )
                .trim()
                .toUpperCase();

            let statusSPJClass =
                "default";

            if(
                statusSPJ === "BELUM ADA" ||
                statusSPJ === "BELUM"
            ){
                statusSPJClass = "belum";
            }
            else if(
                statusSPJ === "REVISI" ||
                statusSPJ === "PERLU REVISI"
            ){
                statusSPJClass = "revisi";
            }
            else if(
                statusSPJ === "SELESAI" ||
                statusSPJ === "SUDAH SELESAI"
            ){
                statusSPJClass = "selesai";
            }
            else if(
                statusSPJ === "DIPROSES" ||
                statusSPJ === "PROSES"
            ){
                statusSPJClass = "proses";
            }

            /* ------------------------------------------
               RENDER
            ------------------------------------------ */
            return `
                <article
                    class="smartoffice-spd-riwayat-card"
                    data-id-spd="${smartofficeEscapeHtml(
                        item.idSPD || ""
                    )}"
                >
                    <!-- =================================
                         HEADER
                    ================================= -->
                    <div class="smartoffice-spd-riwayat-header">
                        <div class="smartoffice-spd-riwayat-header-left">

                            <!-- SVG DOCUMENT ICON -->
                            <div class="smartoffice-spd-riwayat-icon">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="19"
                                    height="19"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                    />

                                    <path
                                        d="M14 2v6h6"
                                    />

                                    <path
                                        d="M8 13h8"
                                    />

                                    <path
                                        d="M8 17h5"
                                    />
                                </svg>
                            </div>

                            <!-- TITLE -->
                            <div class="smartoffice-spd-riwayat-heading">
                                <strong>
                                    ${smartofficeEscapeHtml(
                                        item.idSPD || "-"
                                    )}
                                </strong>

                                <span>
                                    SPD PERJALANAN DINAS
                                </span>
                            </div>
                        </div>

                        <!-- STATUS SPD -->
                        <div
                            class="
                                smartoffice-spd-riwayat-status
                                smartoffice-spd-riwayat-status-${statusClass}
                            "
                        >
                            ${smartofficeEscapeHtml(
                                statusSPD
                            )}
                        </div>
                    </div>

                    <!-- =================================
                         PEGAWAI
                    ================================= -->
                    <div class="smartoffice-spd-riwayat-person">
                        <strong>
                            ${smartofficeEscapeHtml(
                                item.nama || "-"
                            )}
                        </strong>

                        <span>
                            ${smartofficeEscapeHtml(
                                item.nip || "-"
                            )}
                        </span>
                    </div>

                    <!-- =================================
                         KEGIATAN
                    ================================= -->
                    <div class="smartoffice-spd-riwayat-section">
                        <span class="smartoffice-spd-riwayat-label">
                            KEGIATAN
                        </span>

                        <strong>
                            ${smartofficeEscapeHtml(
                                item.kegiatan || "-"
                            )}
                        </strong>
                    </div>

                    <!-- =================================
                         INFO UTAMA
                    ================================= -->
                    <div class="smartoffice-spd-riwayat-info-grid">
                        <div class="smartoffice-spd-riwayat-info-box">
                            <span>
                                BERANGKAT
                            </span>

                            <strong>
                                ${smartofficeEscapeHtml(
                                    item.tanggalBerangkat || "-"
                                )}
                            </strong>
                        </div>

                        <div class="smartoffice-spd-riwayat-info-box">
                            <span>
                                PULANG
                            </span>

                            <strong>
                                ${smartofficeEscapeHtml(
                                    item.tanggalPulang || "-"
                                )}
                            </strong>
                        </div>

                        <div class="smartoffice-spd-riwayat-info-box">
                            <span>
                                PERJALANAN
                            </span>

                            <strong>
                                ${smartofficeEscapeHtml(
                                    item.tipePerjalanan || "-"
                                )}
                            </strong>
                        </div>

                        <div class="smartoffice-spd-riwayat-info-box">
                            <span>
                                JUMLAH HARI
                            </span>

                            <strong>
                                ${smartofficeEscapeHtml(
                                    jumlahHari
                                )}
                            </strong>
                        </div>
                    </div>

                    <!-- =================================
                         LOKASI
                    ================================= -->
                    <div class="smartoffice-spd-riwayat-location">
                        <span>
                            LOKASI
                        </span>

                        <strong>
                            ${smartofficeEscapeHtml(
                                item.lokasi || "-"
                            )}
                        </strong>
                    </div>

                    <!-- =================================
                         PENGIKUT
                    ================================= -->
                    ${
                        pengikut.length
                            ? `
                                <div class="smartoffice-spd-riwayat-followers">
                                    <div class="smartoffice-spd-riwayat-label">
                                        PENGIKUT
                                    </div>

                                    <div class="smartoffice-spd-riwayat-followers-list">
                                        ${
                                            pengikut
                                                .map(function(nama, index){
                                                    return `
                                                        <div
                                                            class="smartoffice-spd-riwayat-follower"
                                                        >
                                                            <span
                                                                class="smartoffice-spd-riwayat-follower-number"
                                                            >
                                                                ${index + 1}
                                                            </span>

                                                            <strong
                                                                class="smartoffice-spd-riwayat-follower-name"
                                                            >
                                                                ${smartofficeEscapeHtml(
                                                                    nama
                                                                )}
                                                            </strong>
                                                        </div>
                                                    `;
                                                })
                                                .join("")
                                        }
                                    </div>
                                </div>
                            `
                            : ""
                    }

                    <!-- =================================
                         STATUS SPJ
                    ================================= -->
                    <div class="smartoffice-spd-riwayat-spj">
                        <div class="smartoffice-spd-riwayat-spj-label">
                            <span>
                                STATUS SPJ
                            </span>

                            <strong
                                class="
                                    smartoffice-spd-riwayat-spj-status
                                    smartoffice-spd-riwayat-spj-status-${statusSPJClass}
                                "
                            >
                                ${smartofficeEscapeHtml(
                                    statusSPJ
                                )}
                            </strong>
                        </div>
                    </div>

                    <!-- =================================
                         FOOTER
                    ================================= -->
                    <div class="smartoffice-spd-riwayat-footer">
                        <button
                            type="button"
                            class="smartoffice-spd-riwayat-detail"
                            data-action="detail"
                            data-id-spd="${smartofficeEscapeHtml(
                                item.idSPD || ""
                            )}"
                        >
                            <span>
                                Lihat SPD
                            </span>

                            <!-- SVG ARROW -->
                            <svg
                                viewBox="0 0 24 24"
                                width="13"
                                height="13"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M5 12h14"/>

                                <path d="m13 6 6 6-6 6"/>
                            </svg>
                        </button>

                        <!-- SVG MORE -->
                        <button
                            type="button"
                            class="smartoffice-spd-riwayat-more"
                            data-action="more"
                            data-id-spd="${smartofficeEscapeHtml(
                                item.idSPD || ""
                            )}"
                            aria-label="Menu SPD"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                width="17"
                                height="17"
                                fill="currentColor"
                                aria-hidden="true"
                            >

                                <circle
                                    cx="12"
                                    cy="5"
                                    r="1.7"
                                />

                                <circle
                                    cx="12"
                                    cy="12"
                                    r="1.7"
                                />

                                <circle
                                    cx="12"
                                    cy="19"
                                    r="1.7"
                                />
                            </svg>
                        </button>
                    </div>
                </article>
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

/* ======================================================
   16.5 NORMALISASI DATA RIWAYAT SPD FIRESTORE
====================================================== */
function smartofficeNormalizeSPDData(item){

    return {
        idSPD:
            item["ID SPD"] ||
            item.id ||
            "",

        nama:
            item["Nama"] ||
            "",

        nip:
            item["NIP / NRP"] ||
            "",

        kegiatan:
            item["Kegiatan"] ||
            "",

        lokasi:
            item["Lokasi"] ||
            "",

        tanggalBerangkat:
            item["Tanggal Berangkat"] ||
            "",

        tanggalPulang:
            item["Tanggal Pulang"] ||
            "",

        jumlahHari:
            item["Jumlah Hari"] ||
            "",

         tipePerjalanan:
            item["Tipe Keberangkatan"] ||
            item["JENIS_PERJALANAN_DINAS"] ||
            "",

        statusSPD:
            item["STATUS_SPD"] ||
            "",

        statusSPJ:
            item["STATUS_SPJ"] ||
            "BELUM ADA",

        jumlahUang:
            item["JUMLAH UANG"] ||
            "",

        catatanRevisiSPJ:
            item["CATATAN_REVISI_SPJ"] ||
            "",

        tglUpdateSPJ:
            item["TGL_UPDATE_SPJ"] ||
            "",

        linkPdf:
            item["LINK_PDF_SPD"] ||
            "",

        pdfGenerated:
            item["PDF_GENERATED"] ||
            "",

        statusData:
            item["STATUS_DATA"] ||
            "",

        pengikut: [
            item["Nama Pengikut 1"] || "",
            item["Nama Pengikut 2"] || "",
            item["Nama Pengikut 3"] || "",
            item["Nama Pengikut 4"] || ""
        ],

        nipPengikut: [
            item["NIP/NRP Pengikut 1"] || "",
            item["NIP/NRP Pengikut 2"] || "",
            item["NIP/NRP Pengikut 3"] || "",
            item["NIP/NRP Pengikut 4"] || ""
        ],

        raw: item
    };
}

/* ======================================================
   16.6 LOAD RIWAYAT SPD DARI FIRESTORE
====================================================== */
async function smartofficeLoadRiwayatSPD(){

    try {
        const data =
            await smartofficeGetAllSPDFromFirestore();

        const normalized =
            Array.isArray(data)
                ? data.map(
                    smartofficeNormalizeSPDData
                )
                : [];

        const userData =
            smartofficeFilterSPDByUser(
                normalized
            );

        smartofficeSPDRiwayat =
            userData;

        smartofficeRenderRiwayatSPDList(
            smartofficeSPDRiwayat
        );

        smartofficeUpdateSPDStats();

    } catch(error){
        console.error(
            "SMARTSPD LOAD RIWAYAT ERROR:",
            error
        );

        smartofficeSPDRiwayat = [];

        smartofficeRenderRiwayatSPDUnavailable();
    }
}

/* ======================================================
   16.7 FILTER SPD SESUAI USER
   NIP UTAMA ATAU PENGIKUT
====================================================== */
function smartofficeFilterSPDByUser(data){

    const sessionData =
        smartofficeGetSession();
    if(!sessionData){
        return [];
    }

    const role =
        String(sessionData.role || "")
            .trim()
            .toUpperCase();

    const nipUser =
        String(sessionData.nip || "")
            .trim();

    /* ================================================
       ROLE KHUSUS → LIHAT SEMUA SPD
    ================================================ */
    if(
        role === "ADMIN" ||
        role === "PJ" ||
        role === "SUPERADMIN"
    ){
        return data;
    }

    /* ================================================
       PEGAWAI → NIP UTAMA ATAU PENGIKUT
    ================================================ */
    return data.filter(function(item){

        const nipUtama =
            String(item.nip || "")
                .trim();
        if(nipUtama === nipUser){
            return true;
        }

        const pengikut =
            Array.isArray(item.nipPengikut)
                ? item.nipPengikut
                : [];

        return pengikut.some(function(nip){
            return String(nip || "")
                .trim() === nipUser;
        });
    });
}

/* ======================================================
   16.8 INIT FILTER RIWAYAT SPD
====================================================== */
function smartofficeInitRiwayatSPDFilter(){

    const search =
        document.getElementById(
            "smartofficeSPDRiwayatSearch"
        );

    const month =
        document.getElementById(
            "smartofficeSPDRiwayatMonth"
        );

    const year =
        document.getElementById(
            "smartofficeSPDRiwayatYear"
        );

    const status =
        document.getElementById(
            "smartofficeSPDRiwayatStatus"
        );

    const reset =
        document.getElementById(
            "smartofficeSPDRiwayatReset"
        );
    if(
        !search ||
        !month ||
        !year ||
        !status ||
        !reset
    ){
        return;
    }

    /* ================================================
       BULAN
    ================================================ */
    const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];

    const monthSet =
        new Set();

    const yearSet =
        new Set();

    const statusSet =
        new Set();

    smartofficeSPDRiwayat.forEach(function(item){

        const tanggal =
            String(
                item.tanggalBerangkat || ""
            ).trim();
        if(tanggal){
            const parts =
                tanggal.split("-");
            if(parts.length === 3){
                const y =
                    Number(parts[0]);

                const m =
                    Number(parts[1]);
                if(y){
                    yearSet.add(y);
                }

                if(m >= 1 && m <= 12){
                    monthSet.add(m);
                }
            }
        }

        const statusSPD =
            String(
                item.statusSPD || ""
            ).trim();
        if(statusSPD){
            statusSet.add(statusSPD);
        }
    });

    monthSet.forEach(function(monthNumber){
        month.insertAdjacentHTML(
            "beforeend",
            `
            <option value="${monthNumber}">
                ${months[monthNumber - 1]}
            </option>
            `
        );
    });

    Array.from(yearSet)
        .sort(function(a,b){
            return b - a;
        })
        .forEach(function(yearValue){
            year.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${yearValue}">
                    ${yearValue}
                </option>
                `
            );
        });

    Array.from(statusSet)
        .sort()
        .forEach(function(statusValue){
            status.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${smartofficeEscapeHtml(statusValue)}">
                    ${smartofficeEscapeHtml(statusValue)}
                </option>
                `
            );
        });

    /* ================================================
       DEFAULT → BULAN BERJALAN
    ================================================ */
    const currentMonth =
        new Date().getMonth() + 1;

    const currentYear =
        new Date().getFullYear();

    if(
        monthSet.has(currentMonth)
    ){
        month.value =
            String(currentMonth);
    }

    if(
        yearSet.has(currentYear)
    ){
        year.value =
            String(currentYear);
    }

    /* ================================================
       EVENTS
    ================================================ */
    search.addEventListener(
        "input",
        smartofficeApplyRiwayatSPDFilter
    );

    month.addEventListener(
        "change",
        smartofficeApplyRiwayatSPDFilter
    );

    year.addEventListener(
        "change",
        smartofficeApplyRiwayatSPDFilter
    );

    status.addEventListener(
        "change",
        smartofficeApplyRiwayatSPDFilter
    );

    reset.addEventListener(
        "click",
        function(){
            search.value = "";
            month.value = "";
            year.value = "";
            status.value = "";

            smartofficeApplyRiwayatSPDFilter();
        }
    );

    smartofficeApplyRiwayatSPDFilter();
}

/* ======================================================
   16.9 APPLY FILTER RIWAYAT SPD
====================================================== */
function smartofficeApplyRiwayatSPDFilter(){

    const search =
        document.getElementById(
            "smartofficeSPDRiwayatSearch"
        );

    const month =
        document.getElementById(
            "smartofficeSPDRiwayatMonth"
        );

    const year =
        document.getElementById(
            "smartofficeSPDRiwayatYear"
        );

    const status =
        document.getElementById(
            "smartofficeSPDRiwayatStatus"
        );
    if(
        !search ||
        !month ||
        !year ||
        !status
    ){
        return;
    }

    const keyword =
        String(search.value || "")
            .trim()
            .toLowerCase();

    const selectedMonth =
        String(month.value || "");

    const selectedYear =
        String(year.value || "");

    const selectedStatus =
        String(status.value || "");

    const filtered =
        smartofficeSPDRiwayat.filter(
            function(item){

                /* SEARCH */
                const searchable = [
                    item.nama,
                    item.kegiatan,
                    item.lokasi,
                    item.idSPD
                ]
                .join(" ")
                .toLowerCase();

                if(
                    keyword &&
                    !searchable.includes(keyword)
                ){
                    return false;
                }

                /* TANGGAL BERANGKAT */
                const tanggal =
                    String(
                        item.tanggalBerangkat || ""
                    );

                const parts =
                    tanggal.split("-");

                if(parts.length === 3){
                    const itemYear =
                        parts[0];

                    const itemMonth =
                        String(
                            Number(parts[1])
                        );

                    if(
                        selectedYear &&
                        itemYear !== selectedYear
                    ){
                        return false;
                    }

                    if(
                        selectedMonth &&
                        itemMonth !== selectedMonth
                    ){
                        return false;
                    }
                }

                /* STATUS */
                if(
                    selectedStatus &&
                    item.statusSPD !== selectedStatus
                ){
                    return false;
                }

                return true;
            }
        );

    smartofficeRenderRiwayatSPDList(
        filtered
    );
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


/* ================================================================================================
   19. ACTION MENU
================================================================================================ */
/* ==========================================================
   SMARTSPD BLUD
   ACTION MENU RIWAYAT SPD
========================================================== */
function smartofficeInitSPDActionMenu(){

    const list =
        document.getElementById(
            "smartofficeRiwayatSPDList"
        );
    if(!list){
        return;
    }

    /*
     * Hapus listener lama jika fungsi dipanggil ulang.
     */
    if(list._smartofficeSPDActionMenuHandler){
        list.removeEventListener(
            "click",
            list._smartofficeSPDActionMenuHandler
        );
    }

    const handler =
        function(event){
            const button =
                event.target.closest(
                    '.smartoffice-spd-riwayat-more[data-action="more"]'
                );
            if(!button){
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const idSPD =
                String(
                    button.dataset.idSpd || ""
                ).trim();
            if(!idSPD){
                return;
            }

            const item =
                smartofficeSPDRiwayat.find(
                    function(data){
                        return String(
                            data.idSPD || ""
                        ).trim() === idSPD;
                    }
                );
            if(!item){
                console.warn(
                    "SMARTSPD ACTION MENU: data tidak ditemukan",
                    idSPD
                );

                return;
            }

            smartofficeOpenSPDActionMenu(
                button,
                item
            );
        };

    list.addEventListener(
        "click",
        handler
    );

    list._smartofficeSPDActionMenuHandler =
        handler;
}


/* ==========================================================
   OPEN ACTION MENU
========================================================== */
function smartofficeOpenSPDActionMenu(
    button,
    item
){
    smartofficeCloseSPDActionMenu();

    const sessionData =
        smartofficeGetSession();
    if(!sessionData){
        return;
    }

    const role =
        String(
            sessionData.role || ""
        )
        .trim()
        .toUpperCase();

    const nipUser =
        String(
            sessionData.nip || ""
        )
        .trim();

    const statusSPD =
        String(
            item.statusSPD || ""
        )
        .trim()
        .toUpperCase();

    const statusSPJ =
        String(
            item.statusSPJ || "BELUM ADA"
        )
        .trim()
        .toUpperCase();

    /* ======================================================
       LOCK SPD
    ====================================================== */
    const lockSPD =
        String(
            item.raw &&
            item.raw["LOCK_SPD"]
                ? item.raw["LOCK_SPD"]
                : ""
        )
        .trim()
        .toUpperCase();

    /* ======================================================
       ROLE
    ====================================================== */
    const isAdmin =
        role === "ADMIN" ||
        role === "PJ" ||
        role === "SUPERADMIN";

    const isSuperAdmin =
        role === "SUPERADMIN";

    /* ======================================================
       LOCK STATE
    ====================================================== */
    const isLocked =
        lockSPD === "TERKUNCI";

    const isOpen =
        lockSPD === "TERBUKA";

    /* ======================================================
       STATUS
    ====================================================== */
    const isApproved =
        statusSPD === "DISETUJUI";

    /* ======================================================
       NIP PETUGAS UTAMA
    ====================================================== */
    const nipPemilik =
        String(
            item.raw &&
            item.raw["NIP / NRP"]
                ? item.raw["NIP / NRP"]
                : ""
        )
        .trim();

    /* ======================================================
       CEK PETUGAS UTAMA
       
       HANYA NIP UTAMA YANG BOLEH EDIT.
       NIP PENGIKUT TIDAK BOLEH EDIT.
    ====================================================== */
    const isPemilikSPD =
        Boolean(
            nipUser &&
            nipPemilik &&
            nipUser === nipPemilik
        );

    /* ======================================================
       MENU ITEMS
    ====================================================== */
    const menuItems = [];

    /* ======================================================
       DETAIL SPD
       SEMUA ROLE
    ====================================================== */
    menuItems.push({
        action: "detail",
        icon: `
            <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
        `,
        label: "Detail SPD"
    });

    /* ======================================================
       EDIT SPD
       
       HANYA:
       1. USER BIASA
       2. PETUGAS UTAMA / PEMILIK SPD
       3. LOCK = TERBUKA
       
       ADMIN / PJ / SUPERADMIN TIDAK BOLEH EDIT
       MELALUI FORM SPD.
    ====================================================== */
    if(
        !isAdmin &&
        isPemilikSPD &&
        isOpen
    ){
        menuItems.push({
            action: "edit",
            icon: `
                <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>
                </svg>
            `,
            label: "Edit SPD"
        });
    }

    /* ======================================================
       BUKA LOCK
       
       HANYA ADMIN / PJ / SUPERADMIN
       
       Jika LOCK TERKUNCI:
       admin membuka lock agar PETUGAS UTAMA dapat
       melakukan edit melalui Form SPD.
    ====================================================== */
    if(
        isAdmin &&
        isLocked
    ){
        menuItems.push({
            action: "unlock",
            icon: `
                <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <rect
                        x="3"
                        y="11"
                        width="18"
                        height="10"
                        rx="2"
                    />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                </svg>
            `,
            label: "Buka Lock"
        });
    }

    /* ======================================================
       VERIFIKASI SPJ
       
       HANYA ADMIN / PJ / SUPERADMIN
       
       TIDAK TERGANTUNG LOCK SPD.
       SPJ berdiri sendiri.
    ====================================================== */
    if(isAdmin){
        menuItems.push({
            action: "spj",
            icon: `
                <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d="M6 2h9l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
                    <path d="M14 2v5h5"/>
                    <path d="M8 13h8"/>
                    <path d="M8 17h6"/>
                </svg>
            `,
            label: "Verifikasi SPJ"
        });
    }

    /* ======================================================
       HAPUS SPD
       
       ATURAN LAMA DIPERTAHANKAN:
       
       USER:
       boleh hapus jika belum DISETUJUI.
       
       ADMIN:
       boleh hapus permanen.
       
       SUPERADMIN:
       boleh hapus permanen.
       
       PJ:
       tidak otomatis mendapat hak hapus permanen.
    ====================================================== */
    const canDelete =
        (
            !isAdmin &&
            !isApproved
        )
        ||
        role === "ADMIN"
        ||
        isSuperAdmin;

    if(canDelete){
        menuItems.push({
            action: "delete",
            danger: true,
            icon: `
                <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d="M3 6h18"/>
                    <path d="M8 6V4h8v2"/>
                    <path d="M19 6l-1 15H6L5 6"/>
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                </svg>
            `,
            label: "Hapus SPD"
        });
    }

    /* ======================================================
       BUILD MENU
    ====================================================== */
    const menu =
        document.createElement("div");

    menu.className =
        "smartoffice-spd-action-menu";

    menu.dataset.idSpd =
        String(
            item.idSPD || ""
        );

    menu.innerHTML =
        menuItems
            .map(function(menuItem){
                return `
                    <button
                        type="button"
                        class="
                            smartoffice-spd-action-menu-item
                            ${menuItem.danger ? "danger" : ""}
                        "
                        data-action="${menuItem.action}"
                    >
                        <span
                            class="smartoffice-spd-action-menu-icon"
                        >
                            ${menuItem.icon}
                        </span>

                        <span>
                            ${smartofficeEscapeHtml(
                                menuItem.label
                            )}
                        </span>
                    </button>
                `;
            })
            .join("");

    /* ======================================================
       MASUKKAN KE BODY
    ====================================================== */
    document.body.appendChild(menu);
    smartofficeSPDActionMenuElement =
        menu;

    /* ======================================================
       POSITION
    ====================================================== */
    const buttonRect =
        button.getBoundingClientRect();

    const menuRect =
        menu.getBoundingClientRect();

    const margin = 8;

    let top =
        buttonRect.bottom +
        margin;

    let left =
        buttonRect.right -
        menuRect.width;

    /* Jangan keluar kanan */
    if(
        left +
        menuRect.width >
        window.innerWidth -
        margin
    ){
        left =
            window.innerWidth -
            menuRect.width -
            margin;
    }

    /* Jangan keluar kiri */
    if(left < margin){
        left =
            margin;
    }

    /* Jika tidak cukup ruang di bawah,
       buka ke atas */
    if(
        top +
        menuRect.height >
        window.innerHeight -
        margin
    ){
        top =
            buttonRect.top -
            menuRect.height -
            margin;
    }

    if(top < margin){
        top =
            margin;
    }

    menu.style.top =
        `${top}px`;

    menu.style.left =
        `${left}px`;

    /* ======================================================
       MENU CLICK
    ====================================================== */
    menu.addEventListener(
        "click",
        function(event){
            const actionButton =
                event.target.closest(
                    "[data-action]"
                );
            if(!actionButton){
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const action =
                actionButton.dataset.action;

            smartofficeCloseSPDActionMenu();
            smartofficeHandleSPDAction(
                action,
                item
            );
        }
    );
}


/* ==========================================================
   CLOSE ACTION MENU
========================================================== */
function smartofficeCloseSPDActionMenu(){

    if(
        smartofficeSPDActionMenuElement &&
        smartofficeSPDActionMenuElement.parentNode
    ){
        smartofficeSPDActionMenuElement.remove();
    }

    smartofficeSPDActionMenuElement =
        null;
}


/* ==========================================================
   GLOBAL ACTION MENU EVENTS
========================================================== */
function smartofficeInitSPDActionMenuGlobalEvents(){

    /*
     * Klik di luar menu.
     */
    if(
        window._smartofficeSPDActionOutsideHandler
    ){
        document.removeEventListener(
            "click",
            window._smartofficeSPDActionOutsideHandler
        );
    }

    window._smartofficeSPDActionOutsideHandler =
        function(event){
            if(
                !smartofficeSPDActionMenuElement
            ){
                return;
            }

            if(
                event.target.closest(
                    ".smartoffice-spd-action-menu"
                )
            ){
                return;
            }

            if(
                event.target.closest(
                    '.smartoffice-spd-riwayat-more[data-action="more"]'
                )
            ){
                return;
            }

            smartofficeCloseSPDActionMenu();
        };

    document.addEventListener(
        "click",
        window._smartofficeSPDActionOutsideHandler
    );

    /*
     * ESC
     */
    if(
        window._smartofficeSPDActionEscapeHandler
    ){
        document.removeEventListener(
            "keydown",
            window._smartofficeSPDActionEscapeHandler
        );
    }

    window._smartofficeSPDActionEscapeHandler =
        function(event){
            if(
                event.key === "Escape"
            ){
                smartofficeCloseSPDActionMenu();
            }
        };

    document.addEventListener(
        "keydown",
        window._smartofficeSPDActionEscapeHandler
    );
}


/* ==========================================================
   HANDLE ACTION
========================================================== */
function smartofficeHandleSPDAction(
    action,
    item
){
    const idSPD =
        String(
            item.idSPD || ""
        ).trim();
    if(!idSPD){
        return;
    }

    switch(action){
        case "detail":
            smartofficeOpenSPDDetail(
                item
            );
            break;

        case "edit":
            smartofficeEditSPD(
                item
            );
            break;

        case "unlock":
            smartofficeUnlockSPD(
                item
            );
            break;

        case "spj":
            smartofficeVerifySPJ(
                item
            );
            break;

        case "delete":
            smartofficeDeleteSPD(
                item
            );
            break;

        default:
            console.warn(
                "SMARTSPD ACTION tidak dikenal:",
                action
            );
    }
}


/* ==========================================================
   DETAIL SPD LENGKAP
   SPD → REVIEW → PDF → SPJ → PEMBAYARAN
========================================================== */
function smartofficeOpenSPDDetail(item){

    if(!item){
        return;
    }

    const raw =
        item.raw &&
        typeof item.raw === "object"
            ? item.raw
            : {};

    const get =
        function(key, fallback = "-"){
            const value =
                raw[key];
            if(
                value === null ||
                value === undefined ||
                String(value).trim() === ""
            ){
                return fallback;
            }

            return String(value).trim();
        };

    /*
     * ======================================================
     * DATA UTAMA
     * ======================================================
     */
    const idSPD =
        item.idSPD ||
        get("ID SPD");

    const nama =
        item.nama ||
        get("Nama");

    const nip =
        item.nip ||
        get("NIP / NRP");

    const pangkat =
        get("Pangkat & Golongan");

    const jabatan =
        get("Jabatan");

    const email =
        get("Email");

    const noWA =
        get("No_WA");

    const alatAngkut =
        get("Alat Angkut");

    const kegiatan =
        item.kegiatan ||
        get("Kegiatan");

    const lokasi =
        item.lokasi ||
        get("Lokasi");

    const tanggalSPD =
        get("Tanggal SPD Dibuat");

    const tanggalBerangkat =
        item.tanggalBerangkat ||
        get("Tanggal Berangkat");

    const tanggalPulang =
        item.tanggalPulang ||
        get("Tanggal Pulang");

    const jumlahHari =
        item.jumlahHari ||
        get("Jumlah Hari");

    const tipePerjalanan =
        item.tipePerjalanan ||
        get("Tipe Keberangkatan");

    /*
     * ======================================================
     * STATUS SPD
     * ======================================================
     */
    const statusSPD =
        String(
            item.statusSPD ||
            get("STATUS_SPD", "-")
        )
        .trim();

    const reviewer =
        get("REVIEWER");

    const reviewerNIP =
        get("REVIEWER_NIP");

    const tglReview =
        get("TGL_REVIEW_SPD");

    const tglApprove =
        get("TGL_APPROVE_SPD");

    const tglRevisi =
        get("TGL_REVISI_SPD");

    const catatanRevisi =
        get("CATATAN_REVISI_SPD");

    const totalRevisi =
        get("TOTAL_REVISI_SPD", "0");

    /*
     * ======================================================
     * DOKUMEN
     * ======================================================
     */
    const lampiranAjuan =
        get("LAMPIRAN_AJUAN_URL", "");

    const linkPDF =
        item.linkPdf ||
        get("LINK_PDF_SPD", "");

    const pdfGenerated =
        get("PDF_GENERATED", "FALSE");

    const statusData =
        get("STATUS_DATA");

    const lastUpdate =
        get("LAST_UPDATE");

    const lockSPD =
        get("LOCK_SPD", "TERBUKA");

    /*
     * ======================================================
     * SPJ
     * ======================================================
     */
    const jumlahUang =
        get("JUMLAH UANG");

    const statusSPJ =
        String(
            item.statusSPJ ||
            get("STATUS_SPJ", "BELUM ADA")
        )
        .trim();

    const catatanRevisiSPJ =
        get("CATATAN_REVISI_SPJ");

    const tglUpdateSPJ =
        get("TGL_UPDATE_SPJ");

    const reminderSPJ =
        get("REMINDER_SPJ");

    /*
     * ======================================================
     * PEMBAYARAN
     * ======================================================
     */
    const tglTransfer =
        get("TGL_TRANSFER");

    const buktiTransfer =
        get("BUKTI_TRANSFER_URL", "");

    /*
     * ======================================================
     * PENGIKUT
     * ======================================================
     */
    const followers = [];

    for(let i = 1; i <= 4; i++){
        const namaPengikut =
            get(
                "Nama Pengikut " + i,
                ""
            );

        const nipPengikut =
            get(
                "NIP/NRP Pengikut " + i,
                ""
            );

        const tglLahir =
            get(
                "Tgl Lahir " + i,
                ""
            );

        const noWAPengikut =
            get(
                "No_WA Pengikut " + i,
                ""
            );
        if(
            namaPengikut ||
            nipPengikut ||
            tglLahir ||
            noWAPengikut
        ){
            followers.push({
                nomor: i,

                nama:
                    namaPengikut || "-",

                nip:
                    nipPengikut || "-",

                tanggalLahir:
                    tglLahir || "-",

                noWA:
                    noWAPengikut || "-"
            });
        }
    }

    /*
     * ======================================================
     * JADWAL PERJALANAN
     * ======================================================
     */
    const schedules = [];

    for(let i = 1; i <= 3; i++){
        const berangkat =
            get(
                "Berangkat Hari " + i,
                ""
            );

        const pulang =
            get(
                "Pulang Hari " + i,
                ""
            );

        const lokasiHari =
            i === 1
                ? get("Lokasi", "")
                : get(
                    "Lokasi Hari " + i,
                    ""
                );

        const tiba =
            i === 1
                ? ""
                : get(
                    "Tiba Hari " + i,
                    ""
                );
        if(
            berangkat ||
            pulang ||
            lokasiHari ||
            tiba
        ){
            schedules.push({
                hari: i,

                berangkat:
                    berangkat || "-",

                pulang:
                    pulang || "-",

                lokasi:
                    lokasiHari || "-",

                tiba:
                    tiba || "-"
            });
        }
    }

    /*
     * ======================================================
     * HELPER HTML
     * ======================================================
     */
    const escape =
        function(value){
            return smartofficeEscapeHtml(
                String(
                    value === null ||
                    value === undefined
                        ? ""
                        : value
                )
            );
        };

    const valueHtml =
        function(label, value){
            return `
                <div class="smartoffice-spd-detail-field">
                    <span>
                        ${escape(label)}
                    </span>

                    <strong>
                        ${escape(value || "-")}
                    </strong>
                </div>
            `;
        };

    const linkHtml =
        function(
            label,
            url,
            text
        ){
            if(!url){

                return valueHtml(
                    label,
                    "-"
                );
            }

            return `
                <div class="smartoffice-spd-detail-field">
                    <span>
                        ${escape(label)}
                    </span>

                    <a
                        href="${escape(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="smartoffice-spd-detail-link"
                    >
                        ${escape(text)}
                    </a>
                </div>
            `;
        };

    /*
     * ======================================================
     * STATUS BADGE
     * ======================================================
     */
    let statusSPDClass =
        "default";

    if(statusSPD === "MENUNGGU REVIEW"){
        statusSPDClass = "waiting";
    }
    else if(statusSPD === "DISETUJUI"){
        statusSPDClass = "approved";
    }
    else if(statusSPD === "DITOLAK"){
        statusSPDClass = "rejected";
    }
    else if(statusSPD === "REVISI"){
        statusSPDClass = "revision";
    }

    let statusSPJClass =
        "belum";

    if(statusSPJ === "DIPROSES"){
        statusSPJClass = "proses";
    }
    else if(
        statusSPJ === "REVISI" ||
        statusSPJ === "PERLU REVISI"
    ){
        statusSPJClass = "revisi";
    }
    else if(
        statusSPJ === "SELESAI" ||
        statusSPJ === "SUDAH SELESAI"
    ){
        statusSPJClass = "selesai";
    }

    const lockClass =
        String(lockSPD).toUpperCase() === "TERKUNCI"
            ? "locked"
            : "open";

    /*
     * ======================================================
     * JADWAL HTML
     * ======================================================
     */
    const scheduleHtml =
        schedules.length
            ? schedules
                .map(function(schedule){
                    return `
                        <div class="smartoffice-spd-detail-schedule">
                            <div class="smartoffice-spd-detail-schedule-title">
                                HARI ${schedule.hari}
                            </div>

                            <div class="smartoffice-spd-detail-schedule-grid">
                                ${valueHtml(
                                    "Berangkat",
                                    schedule.berangkat
                                )}

                                ${valueHtml(
                                    "Pulang",
                                    schedule.pulang
                                )}

                                ${valueHtml(
                                    "Lokasi",
                                    schedule.lokasi
                                )}

                                ${
                                    schedule.hari > 1
                                        ? valueHtml(
                                            "Tiba",
                                            schedule.tiba
                                        )
                                        : ""
                                }
                            </div>
                        </div>
                    `;
                })
                .join("")
            : `
                <div class="smartoffice-spd-detail-empty">
                    Jadwal perjalanan belum tersedia.
                </div>
            `;

    /*
     * ======================================================
     * PENGIKUT HTML
     * ======================================================
     */
    const followersHtml =
        followers.length
            ? followers
                .map(function(follower){

                    return `
                        <div class="smartoffice-spd-detail-follower">
                            <div class="smartoffice-spd-detail-follower-number">
                                ${follower.nomor}
                            </div>

                            <div class="smartoffice-spd-detail-follower-info">
                                <strong>
                                    ${escape(
                                        follower.nama
                                    )}
                                </strong>

                                <span>
                                    NIP/NRP:
                                    ${escape(
                                        follower.nip
                                    )}
                                </span>

                                <span>
                                    Tgl Lahir:
                                    ${escape(
                                        follower.tanggalLahir
                                    )}
                                </span>

                                <span>
                                    No. WA:
                                    ${escape(
                                        follower.noWA
                                    )}
                                </span>
                            </div>
                        </div>
                    `;
                })
                .join("")
            : `
                <div class="smartoffice-spd-detail-empty">
                    Tidak ada pengikut.
                </div>
            `;

    /*
     * ======================================================
     * MODAL
     * ======================================================
     */
    const existing =
        document.getElementById(
            "smartofficeSPDDetailModal"
        );
    if(existing){
        existing.remove();
    }

    const modal =
        document.createElement("div");

    modal.id =
        "smartofficeSPDDetailModal";

    modal.className =
        "smartoffice-spd-detail-modal";

    modal.innerHTML = `

        <div
            class="smartoffice-spd-detail-backdrop"
            data-detail-close="true"
        ></div>

        <div
            class="smartoffice-spd-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smartofficeSPDDetailTitle"
        >
            <div class="smartoffice-spd-detail-header">
                <div>
                    <span class="smartoffice-spd-detail-eyebrow">
                        DETAIL SPD
                    </span>

                    <h2 id="smartofficeSPDDetailTitle">
                        ${escape(idSPD)}
                    </h2>

                    <p>
                        SPD Perjalanan Dinas
                    </p>
                </div>

                <button
                    type="button"
                    class="smartoffice-spd-detail-close"
                    data-detail-close="true"
                    aria-label="Tutup"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="19"
                        height="19"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M18 6 6 18"/>
                        <path d="M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="smartoffice-spd-detail-status-row">
                <span
                    class="
                        smartoffice-spd-detail-status
                        smartoffice-spd-detail-status-${statusSPDClass}
                    "
                >
                    ${escape(statusSPD)}
                </span>

                <span
                    class="
                        smartoffice-spd-detail-lock
                        smartoffice-spd-detail-lock-${lockClass}
                    "
                >
                    LOCK:
                    ${escape(lockSPD)}
                </span>
            </div>

            <div class="smartoffice-spd-detail-body">

                <!-- ==========================================
                     IDENTITAS
                =========================================== -->
                <section class="smartoffice-spd-detail-section">
                    <div class="smartoffice-spd-detail-section-title">
                        <span>
                            IDENTITAS PEGAWAI
                        </span>
                    </div>

                    <div class="smartoffice-spd-detail-grid">
                        ${valueHtml("Nama", nama)}
                        ${valueHtml("NIP / NRP", nip)}
                        ${valueHtml("Pangkat & Golongan", pangkat)}
                        ${valueHtml("Jabatan", jabatan)}
                        ${valueHtml("Email", email)}
                        ${valueHtml("No. WA", noWA)}
                    </div>
                </section>

                <!-- ==========================================
                     PERJALANAN
                =========================================== -->
                <section class="smartoffice-spd-detail-section">
                    <div class="smartoffice-spd-detail-section-title">
                        <span>
                            DETAIL PERJALANAN
                        </span>
                    </div>

                    <div class="smartoffice-spd-detail-grid">
                        ${valueHtml(
                            "Alat Angkut",
                            alatAngkut
                        )}

                        ${valueHtml(
                            "Kegiatan",
                            kegiatan
                        )}

                        ${valueHtml(
                            "Lokasi",
                            lokasi
                        )}

                        ${valueHtml(
                            "Tanggal SPD Dibuat",
                            tanggalSPD
                        )}

                        ${valueHtml(
                            "Tanggal Berangkat",
                            tanggalBerangkat
                        )}

                        ${valueHtml(
                            "Tanggal Pulang",
                            tanggalPulang
                        )}

                        ${valueHtml(
                            "Jumlah Hari",
                            jumlahHari
                        )}

                        ${valueHtml(
                            "Tipe Perjalanan",
                            tipePerjalanan
                        )}
                    </div>
                </section>

                <!-- ==========================================
                     JADWAL
                =========================================== -->
                <section class="smartoffice-spd-detail-section">
                    <div class="smartoffice-spd-detail-section-title">
                        <span>
                            JADWAL PERJALANAN
                        </span>
                    </div>

                    <div class="smartoffice-spd-detail-schedule-list">
                        ${scheduleHtml}
                    </div>
                </section>

                <!-- ==========================================
                     PENGIKUT
                =========================================== -->
                <section class="smartoffice-spd-detail-section">
                    <div class="smartoffice-spd-detail-section-title">
                        <span>
                            PENGIKUT
                        </span>

                        <small>
                            ${followers.length} orang
                        </small>
                    </div>

                    <div class="smartoffice-spd-detail-followers">
                        ${followersHtml}
                    </div>
                </section>

                <!-- ==========================================
                     REVIEW
                =========================================== -->
                <section class="smartoffice-spd-detail-section">
                    <div class="smartoffice-spd-detail-section-title">
                        <span>
                            REVIEW SPD
                        </span>
                    </div>

                    <div class="smartoffice-spd-detail-grid">
                        ${valueHtml(
                            "Reviewer",
                            reviewer
                        )}

                        ${valueHtml(
                            "NIP Reviewer",
                            reviewerNIP
                        )}

                        ${valueHtml(
                            "Tanggal Review",
                            tglReview
                        )}

                        ${valueHtml(
                            "Tanggal Approve",
                            tglApprove
                        )}

                        ${valueHtml(
                            "Tanggal Revisi",
                            tglRevisi
                        )}

                        ${valueHtml(
                            "Total Revisi",
                            totalRevisi
                        )}
                    </div>

                    <div class="smartoffice-spd-detail-note">
                        <span>
                            Catatan Revisi
                        </span>

                        <p>
                            ${escape(
                                catatanRevisi || "-"
                            )}
                        </p>
                    </div>
                </section>

                <!-- ==========================================
                     DOKUMEN
                =========================================== -->
                <section class="smartoffice-spd-detail-section">
                    <div class="smartoffice-spd-detail-section-title">
                        <span>
                            DOKUMEN SPD
                        </span>
                    </div>

                    <div class="smartoffice-spd-detail-grid">
                        ${linkHtml(
                            "Lampiran Ajuan",
                            lampiranAjuan,
                            "Lihat Lampiran"
                        )}

                        ${linkHtml(
                            "PDF SPD",
                            linkPDF,
                            "Buka PDF SPD"
                        )}

                        ${valueHtml(
                            "PDF Generated",
                            pdfGenerated
                        )}
                    </div>
                </section>

                <!-- ==========================================
                     SPJ
                =========================================== -->
                <section class="smartoffice-spd-detail-section">
                    <div class="smartoffice-spd-detail-section-title">
                        <span>
                            SPJ
                        </span>

                        <strong
                            class="
                                smartoffice-spd-detail-spj-status
                                smartoffice-spd-detail-spj-status-${statusSPJClass}
                            "
                        >
                            ${escape(statusSPJ)}
                        </strong>
                    </div>

                    <div class="smartoffice-spd-detail-grid">
                        ${valueHtml(
                            "Jumlah Uang",
                            jumlahUang
                        )}

                        ${valueHtml(
                            "Tanggal Update SPJ",
                            tglUpdateSPJ
                        )}

                        ${valueHtml(
                            "Reminder SPJ",
                            reminderSPJ
                        )}
                    </div>

                    <div class="smartoffice-spd-detail-note">
                        <span>
                            Catatan Revisi SPJ
                        </span>

                        <p>
                            ${escape(
                                catatanRevisiSPJ || "-"
                            )}
                        </p>
                    </div>
                </section>

                <!-- ==========================================
                     PEMBAYARAN
                =========================================== -->
                <section class="smartoffice-spd-detail-section">
                    <div class="smartoffice-spd-detail-section-title">
                        <span>
                            PEMBAYARAN
                        </span>
                    </div>

                    <div class="smartoffice-spd-detail-grid">
                        ${valueHtml(
                            "Tanggal Transfer",
                            tglTransfer
                        )}

                        ${linkHtml(
                            "Bukti Transfer",
                            buktiTransfer,
                            "Lihat Bukti Bayar"
                        )}
                    </div>
                </section>

                <!-- ==========================================
                     SISTEM
                =========================================== -->
                <section class="smartoffice-spd-detail-section">
                    <div class="smartoffice-spd-detail-section-title">
                        <span>
                            INFORMASI SISTEM
                        </span>
                    </div>

                    <div class="smartoffice-spd-detail-grid">
                        ${valueHtml(
                            "Status Data",
                            statusData
                        )}

                        ${valueHtml(
                            "Lock SPD",
                            lockSPD
                        )}

                        ${valueHtml(
                            "Last Update",
                            lastUpdate
                        )}
                    </div>
                </section>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    /*
     * ======================================================
     * CLOSE
     * ======================================================
     */
    const closeModal =
        function(){
            if(
                modal &&
                modal.parentNode
            ){
                modal.remove();
            }

            document.removeEventListener(
                "keydown",
                escapeHandler
            );
        };

    const escapeHandler =
        function(event){
            if(
                event.key === "Escape"
            ){
                closeModal();
            }
        };

    modal.addEventListener(
        "click",
        function(event){
            if(
                event.target.closest(
                    "[data-detail-close='true']"
                )
            ){
                closeModal();
            }
        }
    );

    document.addEventListener(
        "keydown",
        escapeHandler
    );
}


/* ======================================================
   EDIT SPD
====================================================== */
function smartofficeEditSPD(item){

    if(!item){
        smartofficeShowToast(
            "Data SPD tidak ditemukan.",
            "error"
        );

        return;
    }

    /* ==================================================
       SIMPAN STATE EDIT
    ================================================== */
    smartofficeSPDEditMode = true;
    smartofficeSPDEditId =
        String(
            item.idSPD ||
            item.raw?.["ID SPD"] ||
            ""
        ).trim();

    smartofficeSPDEditItem = item;

    if(!smartofficeSPDEditId){
        smartofficeShowToast(
            "ID SPD tidak ditemukan.",
            "error"
        );

        return;
    }

    /* ==================================================
       PINDAH KE FORM
    ================================================== */
    smartofficeSwitchSPDTab("form");

    /* ==================================================
       HELPER SET VALUE
    ================================================== */
    const setValue = function(
        id,
        value
    ){
        const element =
            document.getElementById(id);
        if(!element){
            return;
        }

        element.value =
            value === null ||
            value === undefined
                ? ""
                : String(value);
    };

    /* ==================================================
       RAW DATA
    ================================================== */
    const raw =
        item.raw &&
        typeof item.raw === "object"
            ? item.raw
            : {};

    /* ==================================================
       DATA UTAMA PEGAWAI
    ================================================== */
    setValue(
        "smartofficeSPDNama",
        raw["Nama"] ||
        item.nama ||
        ""
    );

    setValue(
        "smartofficeSPDNip",
        raw["NIP / NRP"] ||
        item.nip ||
        ""
    );

    setValue(
        "smartofficeSPDPangkat",
        raw["Pangkat & Golongan"] ||
        ""
    );

    setValue(
        "smartofficeSPDJabatan",
        raw["Jabatan"] ||
        ""
    );

    setValue(
        "smartofficeSPDEmail",
        raw["Email"] ||
        ""
    );

    setValue(
        "smartofficeSPDNoWA",
        raw["No_WA"] ||
        ""
    );

    /* ==================================================
       DATA PERJALANAN
    ================================================== */
    setValue(
        "smartofficeSPDAlatAngkut",
        raw["Alat Angkut"] ||
        ""
    );

    setValue(
        "smartofficeSPDKegiatan",
        raw["Kegiatan"] ||
        item.kegiatan ||
        ""
    );

    setValue(
        "smartofficeSPDLokasi",
        raw["Lokasi"] ||
        item.lokasi ||
        ""
    );

    /* ==================================================
       NORMALISASI TANGGAL INPUT
       OUTPUT → YYYY-MM-DD
    ================================================== */
    const normalizeDateInput =
        function(value){
            if(!value){
                return "";
            }

            const text =
                String(value).trim();

            /* ------------------------------------------
               SUDAH YYYY-MM-DD
            ------------------------------------------ */
            if(
                /^\d{4}-\d{2}-\d{2}$/.test(
                    text
                )
            ){
                return text;
            }

            /* ------------------------------------------
               DD/MM/YYYY
            ------------------------------------------ */
            let match =
                text.match(
                    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
                );
            if(match){
                return (
                    match[3] +
                    "-" +
                    String(
                        match[2]
                    ).padStart(2,"0") +
                    "-" +
                    String(
                        match[1]
                    ).padStart(2,"0")
                );
            }

            /* ------------------------------------------
               M/D/YYYY
            ------------------------------------------ */
            match =
                text.match(
                    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
                );
            if(match){
                return (
                    match[3] +
                    "-" +
                    String(
                        match[1]
                    ).padStart(2,"0") +
                    "-" +
                    String(
                        match[2]
                    ).padStart(2,"0")
                );
            }

            /* ------------------------------------------
               DATE OBJECT / ISO / FORMAT LAIN
            ------------------------------------------ */
            const date =
                new Date(value);
            if(
                !isNaN(
                    date.getTime()
                )
            ){
                return (
                    date.getFullYear() +
                    "-" +
                    String(
                        date.getMonth() + 1
                    ).padStart(2,"0") +
                    "-" +
                    String(
                        date.getDate()
                    ).padStart(2,"0")
                );
            }

            return "";
        };

    /* ==================================================
       TANGGAL SPD
    ================================================== */
    setValue(
        "smartofficeSPDTanggalSPD",
        normalizeDateInput(
            raw["Tanggal SPD Dibuat"]
        )
    );

    setValue(
        "smartofficeSPDTanggalBerangkat",
        normalizeDateInput(
            raw["Tanggal Berangkat"]
        )
    );

    setValue(
        "smartofficeSPDTanggalPulang",
        normalizeDateInput(
            raw["Tanggal Pulang"]
        )
    );

    /* ==================================================
       HITUNG JUMLAH HARI
    ================================================== */
    smartofficeHitungJumlahHariSPD();

    /* ==================================================
       TIPE KEBERANGKATAN
       PULANG_PERGI / MENGINAP
    ================================================== */
    const tipe =
        String(
            raw["Tipe Keberangkatan"] ||
            item.tipeKeberangkatan ||
            ""
        ).trim();

    const hiddenTipe =
        document.getElementById(
            "smartofficeSPDTipeKeberangkatan"
        );

    if(hiddenTipe){
        hiddenTipe.value = tipe;
    }

    /* ==================================================
       AKTIFKAN TOMBOL TIPE
    ================================================== */
    document
        .querySelectorAll(
            "#smartofficeSPDTipeContainer [data-value]"
        )
        .forEach(function(button){

            const active =
                String(
                    button.dataset.value ||
                    ""
                ) === tipe;

            button.classList.toggle(
                "active",
                active
            );

            button.setAttribute(
                "aria-pressed",
                active
                    ? "true"
                    : "false"
            );
        });

    /* ==================================================
       UPDATE LOCK TIPE
    ================================================== */
    smartofficeUpdateTripTypeLock();

    /* ==================================================
       RENDER ULANG TIMELINE
       BERDASARKAN TANGGAL + TIPE
    ================================================== */
    smartofficeRenderSPDTimeline();

    /* ==================================================
       KEMBALIKAN DETAIL JADWAL DARI DATA LAMA
       
       PENTING:
       Nilai jadwal sekarang adalah TEKS TANGGAL,
       bukan HH:mm.
    ================================================== */
    for(
        let hari = 1;
        hari <= 3;
        hari++
    ){

        const berangkat =
            document.getElementById(
                `smartofficeSPD_BerangkatHari${hari}`
            );

        const pulang =
            document.getElementById(
                `smartofficeSPD_PulangHari${hari}`
            );

        const lokasi =
            document.getElementById(
                `smartofficeSPD_LokasiHari${hari}`
            );

        const tiba =
            document.getElementById(
                `smartofficeSPD_TibaHari${hari}`
            );

        /* ------------------------------------------
           BERANGKAT
        ------------------------------------------ */
        if(berangkat){

            berangkat.value =
                String(
                    raw[
                        `Berangkat Hari ${hari}`
                    ] || ""
                );
        }

        /* ------------------------------------------
           PULANG
        ------------------------------------------ */
        if(pulang){

            pulang.value =
                String(
                    raw[
                        `Pulang Hari ${hari}`
                    ] || ""
                );
        }

        /* ------------------------------------------
           LOKASI
        ------------------------------------------ */
        if(lokasi){

            lokasi.value =
                String(
                    raw[
                        `Lokasi Hari ${hari}`
                    ] || ""
                );
        }

        /* ------------------------------------------
           TIBA
        ------------------------------------------ */
        if(tiba){

            tiba.value =
                String(
                    raw[
                        `Tiba Hari ${hari}`
                    ] || ""
                );
        }
    }

    /* ==================================================
       PENGIKUT
    ================================================== */
    const companionContainer =
        document.getElementById(
            "smartofficeSPDPengikutContainer"
        );

    if(companionContainer){
        companionContainer.innerHTML = "";
        smartofficeSPDJumlahPengikut = 0;

        for(
            let nomor = 1;
            nomor <= 4;
            nomor++
        ){
            const nama =
                String(
                    raw[
                        `Nama Pengikut ${nomor}`
                    ] || ""
                ).trim();

            const nip =
                String(
                    raw[
                        `NIP/NRP Pengikut ${nomor}`
                    ] || ""
                ).trim();

            const lahir =
                String(
                    raw[
                        `Tgl Lahir ${nomor}`
                    ] || ""
                ).trim();

            const noWa =
                String(
                    raw[
                        `No_WA Pengikut ${nomor}`
                    ] || ""
                ).trim();

            /* ------------------------------------------
               JANGAN BUAT KARTU KOSONG
            ------------------------------------------ */
            if(
                !nama &&
                !nip &&
                !lahir &&
                !noWa
            ){
                continue;
            }

            /* ------------------------------------------
               GUNAKAN FUNGSI EXISTING
            ------------------------------------------ */
            smartofficeTambahPengikut();

            const cards =
                document.querySelectorAll(
                    ".smartoffice-spd-pengikut-item"
                );

            const card =
                cards[
                    cards.length - 1
                ];
            if(!card){
                continue;
            }

            const namaInput =
                card.querySelector(
                    ".smartoffice-spd-pengikut-nama"
                );

            const nipInput =
                card.querySelector(
                    ".smartoffice-spd-pengikut-nip"
                );

            const lahirInput =
                card.querySelector(
                    ".smartoffice-spd-pengikut-tgllahir"
                );

            const waInput =
                card.querySelector(
                    ".smartoffice-spd-pengikut-no-wa"
                );

            if(namaInput){
                namaInput.value =
                    nama;
            }

            if(nipInput){
                nipInput.value =
                    nip;
            }

            if(lahirInput){

                lahirInput.value =
                    smartofficeFormatTanggalLahirPengikut(
                        lahir
                    );
            }

            if(waInput){
                waInput.value =
                    noWa;
            }
        }
    }

    /* ==================================================
       FILE LAMPIRAN
       
       FILE LAMA TIDAK DIMASUKKAN
       KE INPUT FILE BROWSER
    ================================================== */
    smartofficeSPDFile = null;

    const fileInput =
        document.getElementById(
            "smartofficeSPDLampiran"
        );
    if(fileInput){
        fileInput.value = "";
    }

    const fileName =
        document.getElementById(
            "smartofficeSPDLampiranName"
        );

    if(fileName){
        const oldLampiran =
            raw["LAMPIRAN_AJUAN_URL"] ||
            "";

        fileName.textContent =
            oldLampiran
                ? "Lampiran sebelumnya tersedia"
                : "Belum ada file dipilih";
    }

    /* ==================================================
       BUKA DETAIL JADWAL
    ================================================== */
    smartofficeOpenSPDJadwal();

    /* ==================================================
       UPDATE UI
    ================================================== */
    smartofficeUpdateLokasiCounter();
    smartofficeUpdateButtonTambahPengikut();
    smartofficeUpdateProgress();
    smartofficeUpdateSubmitButton();

    /* ==================================================
       TEKS TOMBOL
    ================================================== */
    const submitButton =
        document.getElementById(
            "smartofficeSPDSubmitButton"
        );

    const submitText =
        submitButton?.querySelector(
            ".smartoffice-spd-submit-text"
        );
    if(
        submitText &&
        !smartofficeSubmitting
    ){
        submitText.textContent =
            "Simpan Perubahan";
    }

    /* ==================================================
       SCROLL KE FORM
    ================================================== */
    const formContent =
        document.getElementById(
            "smartofficeFormSPDContent"
        );
    if(formContent){
        formContent.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    /* ==================================================
       NOTIFIKASI
    ================================================== */
    smartofficeShowToast(
        "Mode edit SPD aktif.",
        "info"
    );
}
