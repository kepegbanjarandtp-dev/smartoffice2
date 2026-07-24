/* ======================================================
   SMARTOFFICE LOADER
====================================================== */
import "./loader.css";

/* ======================================================
   SHOW LOADER
====================================================== */
export function smartofficeShowLoader(
    element
){
    if(
        !element
    ){
        return;
    }

    element.classList.add(
        "loading"
    );
}


/* ======================================================
   HIDE LOADER
====================================================== */
export function smartofficeHideLoader(
    element
){
    if(
        !element
    ){
        return;
    }

    element.classList.remove(
        "loading"
    );
}


/* ======================================================
   TOGGLE LOADER
====================================================== */
export function smartofficeToggleLoader(
    element,
    isLoading
){
    if(
        isLoading
    ){
        smartofficeShowLoader(
            element
        );

        return;
    }

    smartofficeHideLoader(
        element
    );
}