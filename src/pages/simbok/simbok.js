
/* =========================================================
   SIMBOK — INISIALISASI HALAMAN
========================================================= */

import { smartofficeNavigate } from "../../core/router.js";
import logoSimbok from "../../assets/icons/logo-simbok.svg";

let simbokHandlers = [];


/* =========================================================
   SIMBOK — DAFTARKAN EVENT LISTENER
========================================================= */

function simbokAddHandler(element, eventName, handler) {
  if (!element) return;

  element.addEventListener(eventName, handler);
  simbokHandlers.push([element, eventName, handler]);
}


/* =========================================================
   SIMBOK — AKTIFKAN TAB DAN PANEL
========================================================= */

function simbokActivateTab(tab, tabs, panels, moveFocus = false) {
  const target = tab.dataset.simbokTab;

  // Perbarui status tombol tab dengan class global.
  tabs.forEach(item => {
    item.classList.toggle("active", item === tab);
  });

  // Tampilkan hanya panel yang sesuai dengan tab aktif.
  panels.forEach(panel => {
    const isActive = panel.dataset.simbokPanel === target;

    panel.hidden = !isActive;
  });

  // Fokus digunakan untuk navigasi keyboard.
  if (moveFocus) {
    tab.focus();
  }
}


/* =========================================================
   SIMBOK — LOAD PAGE
========================================================= */

export function smartofficeLoadPage() {
  smartofficeDestroyPage();

  /* Logo halaman simBOK. */
  const pageLogo = document.getElementById("simbokPageLogo");

  if (pageLogo) {
    pageLogo.src = logoSimbok;
  }

  /* Tombol Back sudah ditangani oleh onclick pada HTML. */
  /* Tombol Refresh belum memanggil backend pada tahap ini. */

  const tabs = Array.from(
    document.querySelectorAll(
      ".smartoffice-tab-wrapper [data-simbok-tab]"
    )
  );

  const panels = Array.from(
    document.querySelectorAll("[data-simbok-panel]")
  );

  if (!tabs.length) return;

  /* Klik tab untuk menampilkan panel yang sesuai. */
  tabs.forEach((tab, index) => {
    const clickHandler = () => {
      simbokActivateTab(tab, tabs, panels);
    };

    simbokAddHandler(tab, "click", clickHandler);

    /* Navigasi keyboard: kiri, kanan, Home, dan End. */
    const keyHandler = event => {
      let nextIndex = index;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();

      simbokActivateTab(
        tabs[nextIndex],
        tabs,
        panels,
        true
      );
    };

    simbokAddHandler(tab, "keydown", keyHandler);
  });

  /* Gunakan tab yang memiliki class active di HTML. */
  const initialTab =
    tabs.find(tab => tab.classList.contains("active")) ||
    tabs[0];

  simbokActivateTab(initialTab, tabs, panels);
}


/* =========================================================
   SIMBOK — DESTROY PAGE
   Membersihkan listener saat halaman ditinggalkan.
========================================================= */

export function smartofficeDestroyPage() {
  simbokHandlers.forEach(([element, eventName, handler]) => {
    element.removeEventListener(eventName, handler);
  });

  simbokHandlers = [];
}
