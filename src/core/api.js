/* ======================================================
   SMART OFFICE API
====================================================== */

import { CONFIG } from "./config.js";


/* ======================================================
   REQUEST API
====================================================== */
async function smartofficeRequest(
    action,
    data = {}
){

    console.log(
        "START REQUEST",
        action
    );


    const body =
        new URLSearchParams();


    body.append(
        "action",
        action
    );


    Object.entries(data).forEach(
        ([key, value]) => {

            body.append(
                key,
                value ?? ""
            );

        }
    );


    console.log(
        "BEFORE FETCH"
    );


    const response =
        await fetch(
            CONFIG.API_URL,
            {
                method: "POST",
                body
            }
        );


    console.log(
        "AFTER FETCH",
        response.status
    );


    const text =
        await response.text();


    console.log(
        "RAW RESPONSE",
        text
    );


    return JSON.parse(text);
}


/* ======================================================
   GENERIC API
====================================================== */
export async function smartofficeApi(
    action,
    data = {}
){

    return await smartofficeRequest(
        action,
        data
    );

}