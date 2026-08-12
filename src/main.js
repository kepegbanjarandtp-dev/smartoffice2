/* ======================================================
   SMARTOFFICE V2
====================================================== */
import {
    smartofficeInitializeRouter
}
from "./core/router.js";

import "./styles/global.css";
import "./styles/variables.css";
import "./styles/animation.css";
import "./styles/responsive.css";

import "./pages/login/login.css";
import "./pages/dashboard/dashboard.css";
import "./pages/cuti/cuti.css";
import "./pages/cuti/cuti-riwayat-modal.css";
import "./pages/approval/approval.css";
import "./pages/approval/approval-cuti-modal.css";
import "./pages/management-cuti/management-cuti.css";
import "./pages/buku-tamu/buku-tamu.css";
import "./pages/dokumen-saya/dokumen-saya.css";

import "./components/button/button.css";
import "./components/layout/layout.css";
import "./components/tabs/tabs.css";

document.addEventListener(

    "DOMContentLoaded",

    async ()=>{

        console.log(
            "SmartOffice V2 Started"
        );

        await smartofficeInitializeRouter();
    }
);