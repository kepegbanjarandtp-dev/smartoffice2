/* ======================================================
   SMART OFFICE — SMARTSPD BLUD
   VITE / SPA / PWA MODULE
====================================================== */

/* ======================================================
   CORE
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
   COMPONENT
====================================================== */
import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

/* ======================================================
   SERVICE
====================================================== */
import {
    smartofficeSubmitSPD
} from "../../services/smartspd-blud.service.js";

import {
    smartofficeGetPegawaiFromFirestore,
    smartofficeGetAllPegawaiFromFirestore
} from "../../services/pegawai-firestore.service.js";

/* ======================================================
   UTILS
====================================================== */
import {
    smartofficeConvertFileToBase64
} from "../../utils/file.js";

import "./smartspd-blud.css";


/* ======================================================
   STATE
====================================================== */
let smartofficeSPDPegawai = {};
let smartofficeSPDPegawaiCache = [];
let smartofficeSPDRiwayat = [];
let smartofficeSPDJumlahPengikut = 0;
let smartofficeSPDFile = null;
let smartofficeSubmitting = false;
let smartofficeSPDHandlers = new Map();
let smartofficeSPDPageInstance = 0;


/* ======================================================
   LOAD PAGE
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
   DESTROY PAGE
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


/* ======================================================
   EVENT REGISTRY
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
   INIT PAGE EVENTS
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


/* ======================================================
   LOAD PEGAWAI — FIRESTORE
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
   LOAD CACHE PEGAWAI — FIRESTORE
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
   RENDER PEGAWAI
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


/* ======================================================
   MAIN PEGAWAI AUTOCOMPLETE
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
   SELECT MAIN PEGAWAI
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


/* ======================================================
   REFRESH
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
   TAB
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


/* ======================================================
   PENGIKUT
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

        <div class="smartoffice-cuti-form-group">
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

        <div class="smartoffice-cuti-form-group">
            <label>NIP / NRP</label>
            <input
                type="text"
                class="smartoffice-spd-pengikut-nip"
                readonly
            >
        </div>

        <div class="smartoffice-cuti-form-group">
            <label>Tanggal Lahir</label>
            <input
                type="text"
                class="smartoffice-spd-pengikut-tgllahir"
                readonly
            >
        </div>

        <div class="smartoffice-cuti-form-group">
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


function smartofficeHapusPengikut(card){

    if(!card){
        return;
    }

    card.remove();

    smartofficeRefreshNomorPengikut();
    smartofficeUpdateButtonTambahPengikut();
    smartofficeUpdateProgress();
}


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


/* ======================================================
   AUTOCOMPLETE PENGIKUT
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


function smartofficeCloseAllPengikutAutocomplete(){

    document
        .querySelectorAll(
            ".smartoffice-spd-autocomplete"
        )
        .forEach(function(box){
            box.innerHTML = "";
        });
}


/* ======================================================
   SCHEDULE / TANGGAL
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

                smartofficeValidateDateSunday(input);
                smartofficeHitungJumlahHariSPD();
                smartofficeRenderSPDTimeline();
                smartofficeUpdateProgress();

            }
        );
    });
}


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

    if(!mulai || !selesai){

        if(output){
            output.value = "";
        }

        return 0;
    }

    const start =
        new Date(mulai + "T00:00:00");

    const end =
        new Date(selesai + "T00:00:00");

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

    const days =
        Math.floor(
            (
                end.getTime() -
                start.getTime()
            ) / 86400000
        ) + 1;

    if(output){
        output.value = String(days);
    }

    return days;
}


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

                    document
                        .querySelectorAll(
                            "#smartofficeSPDTipeContainer [data-value]"
                        )
                        .forEach(function(item){
                            item.classList.remove("active");
                        });

                    button.classList.add("active");

                    const hidden =
                        document.getElementById(
                            "smartofficeSPDTipeKeberangkatan"
                        );

                    if(hidden){
                        hidden.value =
                            button.dataset.value || "";
                    }

                    smartofficeUpdateProgress();
                    smartofficeUpdateSubmitButton();

                }
            );

        });
}


function smartofficeRenderSPDTimeline(){

    const container =
        document.getElementById(
            "smartofficeSPDTimelineContainer"
        );

    if(!container){
        return;
    }

    const jumlahHari =
        smartofficeHitungJumlahHariSPD();

    if(!jumlahHari){
        container.innerHTML = "";
        return;
    }

    const maxHari =
        Math.min(
            Number(jumlahHari),
            3
        );

    let html = "";

    for(let hari = 1; hari <= maxHari; hari++){

        html += `
            <div class="smartoffice-spd-timeline-day">
                <div class="smartoffice-spd-timeline-day-title">
                    Hari ${hari}
                </div>
                <div class="smartoffice-spd-jadwal-grid">
        `;

        html += smartofficeRenderTimeField(
            `spd-berangkat-${hari}`,
            `Berangkat Hari ${hari}`,
            `smartofficeSPD_BerangkatHari${hari}`
        );

        html += smartofficeRenderTimeField(
            `spd-pulang-${hari}`,
            `Pulang Hari ${hari}`,
            `smartofficeSPD_PulangHari${hari}`
        );

        if(hari >= 2){

            html += `
                <div class="smartoffice-spd-field">
                    <label>Lokasi Hari ${hari}</label>
                    <input
                        type="text"
                        id="smartofficeSPD_LokasiHari${hari}"
                        maxlength="100"
                        placeholder="Lokasi perjalanan hari ${hari}"
                    >
                </div>

                <div class="smartoffice-spd-field">
                    <label>Tiba Hari ${hari}</label>
                    <input
                        type="time"
                        id="smartofficeSPD_TibaHari${hari}"
                    >
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    }

    if(Number(jumlahHari) > 3){
        html += `
            <div class="smartoffice-spd-empty-state">
                Detail jadwal tersedia sampai Hari 3 pada struktur SPD BLUD saat ini.
            </div>
        `;
    }

    container.innerHTML = html;
}


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


function smartofficeToggleSPDJadwal(){

    const body =
        document.getElementById(
            "smartofficeSPDDetailJadwal"
        );

    const icon =
        document.getElementById(
            "smartofficeSPDJadwalIcon"
        );

    if(!body){
        return;
    }

    const isHidden =
        body.style.display === "none" ||
        body.style.display === "";

    body.style.display =
        isHidden ? "block" : "none";

    if(icon){
        icon.classList.toggle(
            "open",
            isHidden
        );
    }
}


/* ======================================================
   PROGRESS
====================================================== */
function smartofficeInitProgress(){
    smartofficeUpdateProgress();
    smartofficeInitScheduleObserver();
}


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


/* ======================================================
   FILE UPLOAD
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


/* ======================================================
   SUBMIT BUTTON
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
   SUBMIT SPD
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


/* ======================================================
   RESET FORM
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


/* ======================================================
   RIWAYAT FILTER
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
   GLOBAL CLICK OUTSIDE
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


/* ======================================================
   TEXT / URL HELPERS
====================================================== */
function smartofficeEscapeHtml(value){

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

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


