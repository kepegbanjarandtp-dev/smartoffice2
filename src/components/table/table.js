/* ======================================================
   SMARTOFFICE TABLE
====================================================== */

let smartofficeTableBody =
    null;


/* ======================================================
   INITIALIZE TABLE
====================================================== */

export function smartofficeInitializeTable(
    tableBodyId
){

    smartofficeTableBody =
        document.getElementById(
            tableBodyId
        );

}


/* ======================================================
   RENDER TABLE
====================================================== */

export function smartofficeRenderTable(

    data = [],

    renderRow

){

    if(

        !smartofficeTableBody ||

        typeof renderRow !==
        "function"

    ){
        return;
    }

    smartofficeTableBody.innerHTML =

        data.length

            ? data
                .map(
                    renderRow
                )
                .join("")

            : smartofficeRenderEmpty();

}


/* ======================================================
   EMPTY TABLE
====================================================== */

export function smartofficeRenderEmpty(

    message =
        "Data tidak tersedia."

){

    return `

        <tr>

            <td
                colspan="100%"
                class="smartoffice-table-empty"
            >

                ${message}

            </td>

        </tr>

    `;

}


/* ======================================================
   LOADING TABLE
====================================================== */

export function smartofficeRenderLoading(

    message =
        "Memuat data..."

){

    if(
        !smartofficeTableBody
    ){
        return;
    }

    smartofficeTableBody.innerHTML =

        smartofficeRenderEmpty(
            message
        );

}


/* ======================================================
   CLEAR TABLE
====================================================== */

export function smartofficeClearTable(){

    if(
        !smartofficeTableBody
    ){
        return;
    }

    smartofficeTableBody.innerHTML =
        "";

}


/* ======================================================
   DESTROY TABLE
====================================================== */

export function smartofficeDestroyTable(){

    smartofficeClearTable();

    smartofficeTableBody =
        null;

}