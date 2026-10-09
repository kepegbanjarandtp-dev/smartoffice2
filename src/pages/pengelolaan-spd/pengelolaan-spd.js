/* ======================================================
   SMART OFFICE — PENGELOLAAN SPD BLUD
   VITE / SPA / PWA MODULE
====================================================== */

import {
    smartofficeCheckSession,
    smartofficeGetSession,
    smartofficeLogout
} from "../../core/session.js";

import {
    smartofficeNavigate
} from "../../core/router.js";

import {
    smartofficeShowToast
} from "../../components/toast/toast.js";

import {
    smartofficeRenderMobileNavbar
} from "../../components/navbar/navbar.js";

import {
    smartofficeGetAllSPDFromFirestore
} from "../../services/smartspd-blud-firestore.service.js";

import {
    smartofficeRenderRiwayatSPDList
} from "../smartspd-blud/smartspd-blud.js";


/* ======================================================
   STATE
====================================================== */

let smartofficePengelolaanSPDData = [];
let smartofficePengelolaanSPDInstance = 0;
let smartofficePengelolaanSPDHandlers = [];


/* ======================================================
   LOAD PAGE
====================================================== */

export async function smartofficeLoadPage(){

    const instance = ++smartofficePengelolaanSPDInstance;

    smartofficePengelolaanSPDCleanupHandlers();

    if(!smartofficeCheckSession()){
        await smartofficeNavigate("login");
        return;
    }

    const session = smartofficeGetSession();

    if(!session){
        await smartofficeLogout();
        return;
    }

    smartofficeRenderMobileNavbar(
        session.role,
        "spd"
    );

    smartofficeInitPengelolaanSPDEvents(instance);
    smartofficeSwitchPengelolaanSPDTab("overview");

    await smartofficeLoadPengelolaanSPDData(instance);
}


/* ======================================================
   DESTROY PAGE
====================================================== */

export async function smartofficeDestroyPage(){

    smartofficePengelolaanSPDInstance++;

    smartofficePengelolaanSPDCleanupHandlers();

    smartofficePengelolaanSPDData = [];
}


/* ======================================================
   CLEANUP EVENT
====================================================== */

function smartofficePengelolaanSPDCleanupHandlers(){

    smartofficePengelolaanSPDHandlers.forEach(function(item){

        item.element.removeEventListener(
            item.type,
            item.handler
        );

    });

    smartofficePengelolaanSPDHandlers = [];
}


/* ======================================================
   REGISTER EVENT
====================================================== */

function smartofficePengelolaanSPDAddHandler(
    element,
    type,
    handler
){

    if(!element) return;

    element.addEventListener(type, handler);

    smartofficePengelolaanSPDHandlers.push({
        element,
        type,
        handler
    });
}


/* ======================================================
   INIT EVENTS
====================================================== */

function smartofficeInitPengelolaanSPDEvents(instance){

    const backButton = document.querySelector(
        '[data-action="back-dashboard"]'
    );

    smartofficePengelolaanSPDAddHandler(
        backButton,
        "click",
        async function(){

            if(instance !== smartofficePengelolaanSPDInstance){
                return;
            }

            await smartofficeNavigate("dashboard");
        }
    );

    const refreshButton = document.getElementById(
        "smartofficePengelolaanSPDRefreshButton"
    );

    smartofficePengelolaanSPDAddHandler(
        refreshButton,
        "click",
        async function(){
            await smartofficeLoadPengelolaanSPDData(instance);
        }
    );

    smartofficePengelolaanSPDAddHandler(
        document.getElementById("smartofficeTabOverviewPengelolaanSPD"),
        "click",
        function(){
            smartofficeSwitchPengelolaanSPDTab("overview");
        }
    );

    smartofficePengelolaanSPDAddHandler(
        document.getElementById("smartofficeTabRekapPengelolaanSPD"),
        "click",
        function(){
            smartofficeSwitchPengelolaanSPDTab("rekap");
        }
    );

    smartofficeInitPengelolaanSPDFilters();
}


/* ======================================================
   SWITCH TAB
====================================================== */

function smartofficeSwitchPengelolaanSPDTab(tab){

    const config = {
        overview: {
            button: "smartofficeTabOverviewPengelolaanSPD",
            content: "smartofficePengelolaanSPDOverviewContent"
        },
        rekap: {
            button: "smartofficeTabRekapPengelolaanSPD",
            content: "smartofficePengelolaanSPDRekapContent"
        }
    };

    if(!config[tab]) return;

    Object.entries(config).forEach(function([key, item]){

        const button = document.getElementById(item.button);
        const content = document.getElementById(item.content);

        if(button){
            button.classList.toggle("active", key === tab);
            button.setAttribute(
                "aria-selected",
                key === tab ? "true" : "false"
            );
        }

        if(content){
            content.style.display =
                key === tab ? "block" : "none";
        }

    });
}


/* ======================================================
   LOAD DATA SPD — FIRESTORE
====================================================== */

async function smartofficeLoadPengelolaanSPDData(instance){

    const list = document.getElementById(
        "smartofficePengelolaanSPDList"
    );

    if(list){
        list.innerHTML = `
            <div class="smartoffice-approval-skeleton-card">
                Memuat data SPD...
            </div>
        `;
    }

    try{
        console.log("[PENGELOLAAN SPD] Mulai mengambil data");

        const result = await smartofficeGetAllSPDFromFirestore();

        console.log(
            "[PENGELOLAAN SPD] Tipe hasil:",
            Array.isArray(result) ? "Array" : typeof result
        );

        console.log(
            "[PENGELOLAAN SPD] Jumlah data:",
            Array.isArray(result) ? result.length : "Bukan array"
        );

        console.log(
            "[PENGELOLAAN SPD] Contoh data pertama:",
            Array.isArray(result) ? result[0] : result
        );

        console.log(
            "[PENGELOLAAN SPD] Nama field:",
            Array.isArray(result) && result.length
                ? Object.keys(result[0])
                : []
        );

        if(instance !== smartofficePengelolaanSPDInstance){
            return;
        }

        smartofficePengelolaanSPDData =
            Array.isArray(result) ? result : [];

        smartofficeRenderPengelolaanSPDList(
            smartofficePengelolaanSPDData
        );

        smartofficePopulatePengelolaanSPDFilters();

    }
    catch(error){

        console.error(
            "PENGELOLAAN SPD LOAD ERROR:",
            error
        );

        if(list){
            list.innerHTML = `
                <div class="smartoffice-spd-riwayat-empty">
                    Gagal memuat data SPD.
                    Silakan coba kembali.
                </div>
            `;
        }

        smartofficeShowToast(
            "Gagal memuat data SPD.",
            "error"
        );
    }
}


/* ======================================================
   OVERVIEW
====================================================== */

function smartofficeRenderPengelolaanSPDOverview(){

    const container = document.getElementById(
        "smartofficePengelolaanSPDOverviewContent"
    );

    if(!container) return;

    container.innerHTML = `
        <div class="smartoffice-spd-riwayat-empty">
            <div class="smartoffice-spd-riwayat-empty-icon">
                <span>⚙</span>
            </div>

            <strong>Overview SPD sedang dalam pengembangan</strong>

            <span>
                Ringkasan statistik dan pemantauan SPD akan tersedia
                pada pembaruan berikutnya.
            </span>
        </div>
    `;
}


/* ======================================================
   REKAP SPD
====================================================== */
function smartofficeRenderPengelolaanSPDList(data){

    smartofficeRenderRiwayatSPDList(
        data,
        "smartofficePengelolaanSPDList"
    );
}


/* ======================================================
   FILTER REKAP SPD
====================================================== */

function smartofficeInitPengelolaanSPDFilters(){

    const ids = [
        "smartofficePengelolaanSPDSearch",
        "smartofficePengelolaanSPDMonth",
        "smartofficePengelolaanSPDYear",
        "smartofficePengelolaanSPDStatus",
        "smartofficePengelolaanSPDSPJ"
    ];

    ids.forEach(function(id){

        const element = document.getElementById(id);

        smartofficePengelolaanSPDAddHandler(
            element,
            "input",
            smartofficeApplyPengelolaanSPDFilters
        );

        smartofficePengelolaanSPDAddHandler(
            element,
            "change",
            smartofficeApplyPengelolaanSPDFilters
        );
    });

    smartofficePengelolaanSPDAddHandler(
        document.getElementById("smartofficePengelolaanSPDReset"),
        "click",
        function(){

            ids.forEach(function(id){
                const element = document.getElementById(id);

                if(element){
                    element.value = "";
                }
            });

            smartofficeApplyPengelolaanSPDFilters();
        }
    );
}


function smartofficeApplyPengelolaanSPDFilters(){

    const keyword = (
        document.getElementById("smartofficePengelolaanSPDSearch")?.value || ""
    ).trim().toLowerCase();

    const month = (
        document.getElementById("smartofficePengelolaanSPDMonth")?.value || ""
    );

    const year = (
        document.getElementById("smartofficePengelolaanSPDYear")?.value || ""
    );

    const status = (
        document.getElementById("smartofficePengelolaanSPDStatus")?.value || ""
    );

    const statusSPJ = (
        document.getElementById("smartofficePengelolaanSPDSPJ")?.value || ""
    );

    const filtered = smartofficePengelolaanSPDData.filter(function(item){

        const nama = String(item["Nama"] || "").toLowerCase();
        const kegiatan = String(item["Kegiatan"] || "").toLowerCase();
        const lokasi = String(item["Lokasi"] || "").toLowerCase();

        const tanggal = String(item["Tanggal Berangkat"] || "");
        const parts = tanggal.split("-");

        if(
            keyword &&
            !nama.includes(keyword) &&
            !kegiatan.includes(keyword) &&
            !lokasi.includes(keyword)
        ){
            return false;
        }

        if(year && parts.length === 3 && parts[0] !== year){
            return false;
        }

        if(
            month &&
            parts.length === 3 &&
            String(Number(parts[1])) !== String(Number(month))
        ){
            return false;
        }

        if(status && String(item["STATUS_SPD"] || "") !== status){
            return false;
        }

        if(statusSPJ && String(item["STATUS_SPJ"] || "BELUM ADA") !== statusSPJ){
            return false;
        }

        return true;
    });

    smartofficeRenderPengelolaanSPDList(filtered);
}


function smartofficePopulatePengelolaanSPDFilters(){
    /*
     * Pengisian pilihan bulan dan tahun akan disamakan
     * dengan filter asli setelah renderer bersama dipasang.
     */
}