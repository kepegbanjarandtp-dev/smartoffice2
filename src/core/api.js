/* ======================================================
   SMARTOFFICE API
====================================================== */
import { CONFIG }
from "./config.js";

export async function smartofficeApi(
    action,
    data = {}
){

    try{

        /* =========================
           BUILD FORM DATA
        ========================= */
        const formData =
            new URLSearchParams();

        formData.append(
            "action",
            action
        );

        Object.entries(data)
            .forEach(
                ([key,value])=>{

                    formData.append(
                        key,
                        value ?? ""
                    );

                }
            );

        /* =========================
           REQUEST
        ========================= */
        const response =
            await fetch(
                CONFIG.API_URL,
                {
                    method:"POST",
                    body:formData
                }
            );

        const result =
            await response.json();

        return result;

    }
    catch(error){

        console.error(
            "SMARTOFFICE API ERROR",
            error
        );

        return{

            success:false,

            message:
                "Tidak dapat terhubung ke server."

        };

    }

}