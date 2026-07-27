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

import "./components/button/button.css";

document.addEventListener(

    "DOMContentLoaded",

    async ()=>{

        console.log(
            "SmartOffice V2 Started"
        );

        await smartofficeInitializeRouter();
    }
);