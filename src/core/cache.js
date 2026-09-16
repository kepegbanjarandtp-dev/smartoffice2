/* =========================================================
   SMART OFFICE - CACHE
========================================================= */
const CACHE_PREFIX = "smartoffice_cache_";

export function smartofficeCacheGet(key){
    try{
        const raw = sessionStorage.getItem(
            CACHE_PREFIX + key
        );

        if(!raw){
            return null;
        }

        return JSON.parse(raw);
    }
    catch(error){
        console.error(
            "SMARTOFFICE CACHE GET ERROR:",
            error
        );

        return null;
    }
}


export function smartofficeCacheSet(key,data){
    try{
        sessionStorage.setItem(
            CACHE_PREFIX + key,
            JSON.stringify(data)
        );

        return true;
    }
    catch(error){
        console.error(
            "SMARTOFFICE CACHE SET ERROR:",
            error
        );

        return false;
    }
}


export function smartofficeCacheRemove(key){
    try{
        sessionStorage.removeItem(
            CACHE_PREFIX + key
        );

        return true;
    }
    catch(error){
        console.error(
            "SMARTOFFICE CACHE REMOVE ERROR:",
            error
        );

        return false;
    }
}


export function smartofficeCacheClear(){
    try{
        Object.keys(sessionStorage)
            .filter(key =>
                key.startsWith(CACHE_PREFIX)
            )
            .forEach(key =>
                sessionStorage.removeItem(key)
            );

        return true;
    }
    catch(error){
        console.error(
            "SMARTOFFICE CACHE CLEAR ERROR:",
            error
        );

        return false;
    }
}