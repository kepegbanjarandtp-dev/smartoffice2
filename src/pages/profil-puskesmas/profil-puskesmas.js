/* ======================================================
   PROFIL PUSKESMAS GLOBAL — PAGE LIFECYCLE
   Tahap awal: halaman, navigasi tab, dan akses tampilan.
   Koneksi Firestore belum diaktifkan pada tahap ini.
====================================================== */

import { smartofficeNavigate } from "../../core/router.js";
import { smartofficeGetSession } from "../../core/session.js";

const SMARTOFFICE_PP_TAB_CONTENT = {
    ringkasan: {
        title: "Ringkasan Profil",
        description: "Informasi umum Puskesmas dalam satu tampilan."
    },
    identitas: {
        title: "Identitas Puskesmas",
        description: "Identitas resmi, alamat, dan kontak Puskesmas."
    },
    geografis: {
        title: "Geografis dan Wilayah Kerja",
        description: "Lokasi, batas wilayah, dan informasi geografis."
    },
    kependudukan: {
        title: "Data Kependudukan",
        description: "Ringkasan data penduduk di wilayah kerja."
    },
    kepegawaian: {
        title: "Data Kepegawaian",
        description: "Ringkasan sumber daya manusia Puskesmas."
    },
    sarana: {
        title: "Sarana dan Prasarana",
        description: "Fasilitas, sarana, dan prasarana Puskesmas."
    },
    "penanggung-jawab": {
        title: "Penanggung Jawab",
        description: "Informasi penanggung jawab dan pimpinan Puskesmas."
    }
};

let smartofficeProfilPuskesmasHandlers = [];

function smartofficeProfilPuskesmasBind(element, eventName, handler) {
    element?.addEventListener(eventName, handler);
    if (element) {
        smartofficeProfilPuskesmasHandlers.push({
            element,
            eventName,
            handler
        });
    }
}

function smartofficeProfilPuskesmasGetRole(session) {
    const possibleRoles = [
        session?.role,
        session?.ROLE,
        session?.data?.role,
        session?.pegawai?.role
    ];

    return String(possibleRoles.find(Boolean) || "")
        .trim()
        .toUpperCase();
}

function smartofficeProfilPuskesmasSwitchTab(tabName) {
    const tabButtons = document.querySelectorAll(
        ".smartoffice-profil-puskesmas [data-pp-tab]"
    );

    tabButtons.forEach((button) => {
        const isActive = button.dataset.ppTab === tabName;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
    });

    const content = SMARTOFFICE_PP_TAB_CONTENT[tabName];
    if (!content) return;

    const title = document.getElementById("smartofficePpPanelTitle");
    const description = document.getElementById("smartofficePpPanelDescription");

    if (title) title.textContent = content.title;
    if (description) description.textContent = content.description;
}

export async function smartofficeLoadPage() {
    smartofficeProfilPuskesmasHandlers = [];

    const refreshButton = document.getElementById(
        "smartofficeProfilPuskesmasRefresh"
    );

    smartofficeProfilPuskesmasBind(refreshButton, "click", () => {
        // Tahap awal belum mengambil data eksternal; muat ulang modul dengan aman.
        smartofficeNavigate("profil-puskesmas");
    });

    document.querySelectorAll(
        ".smartoffice-profil-puskesmas [data-pp-tab]"
    ).forEach((button) => {
        smartofficeProfilPuskesmasBind(button, "click", () => {
            smartofficeProfilPuskesmasSwitchTab(button.dataset.ppTab);
        });
    });

    const session = smartofficeGetSession();
    const role = smartofficeProfilPuskesmasGetRole(session);
    const editButton = document.getElementById("smartofficePpEditButton");

    // Ini hanya kontrol tampilan. Otorisasi Firestore tetap harus ditegakkan
    // oleh Security Rules sebelum fitur simpan langsung diaktifkan.
    if (editButton) {
        editButton.hidden = role !== "SUPERADMIN";
    }

    console.info("Profil Puskesmas: halaman dasar berhasil dimuat.");
}

export async function smartofficeDestroyPage() {
    smartofficeProfilPuskesmasHandlers.forEach(
        ({ element, eventName, handler }) => {
            element.removeEventListener(eventName, handler);
        }
    );

    smartofficeProfilPuskesmasHandlers = [];
}
