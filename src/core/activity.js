/* ======================================================
   SMARTOFFICE ACTIVITY
====================================================== */
let smartofficeActivityTimer =
    null;

const SMARTOFFICE_TIMEOUT =
    30 * 60 * 1000;


/* ======================================================
   START ACTIVITY MONITOR
====================================================== */
export function smartofficeStartActivityMonitor(){
    smartofficeResetActivityTimer();
    [
        "click",
        "keydown",
        "mousemove",
        "touchstart"
    ].forEach(
        eventName =>
            window.addEventListener(
                eventName,
                smartofficeResetActivityTimer
            )
    );
}


/* ======================================================
   RESET TIMER
====================================================== */
function smartofficeResetActivityTimer(){
    clearTimeout(
        smartofficeActivityTimer
    );

    smartofficeActivityTimer =
        setTimeout(
            smartofficeLogoutByTimeout,
            SMARTOFFICE_TIMEOUT
        );
}


/* ======================================================
   AUTO LOGOUT
====================================================== */

function smartofficeLogoutByTimeout(){

    localStorage.removeItem(
        "smartoffice_session"
    );

    location.reload();

}