/* ======================================================
   SMARTOFFICE AUTH SERVICE
====================================================== */
import { smartofficeApi }
from "../core/api.js";

export async function smartofficeLogin(
    nip,
    password
){

    return await smartofficeApi(
        "login",
        {
            nip,
            password
        }
    );
}