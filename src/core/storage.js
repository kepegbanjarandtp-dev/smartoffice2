/* ======================================================
   SMARTOFFICE STORAGE
====================================================== */
export function smartofficeStorageSet(
    key,
    value
){

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );

}

export function smartofficeStorageGet(
    key
){

    const data =
        localStorage.getItem(
            key
        );

    return data
        ? JSON.parse(data)
        : null;

}

export function smartofficeStorageRemove(
    key
){

    localStorage.removeItem(
        key
    );

}

export function smartofficeStorageClear(){

    localStorage.clear();

}