/* ======================================================
   SMARTOFFICE PAGINATION
====================================================== */
let smartofficePagination = {
    currentPage : 1,
    totalPage : 1,
    pageSize : 10,
    totalData : 0
};


/* ======================================================
   INITIALIZE PAGINATION
====================================================== */
export function smartofficeInitializePagination(
    totalData,
    pageSize = 10
){
    smartofficePagination.totalData =
        totalData;

    smartofficePagination.pageSize =
        pageSize;

    smartofficePagination.currentPage =
        1;

    smartofficePagination.totalPage =

        Math.max(
            1,
            Math.ceil(
                totalData / pageSize
            )
        );
}


/* ======================================================
   SET PAGE
====================================================== */
export function smartofficeSetPage(
    page
){
    if(
        page < 1
    ){
        page = 1;
    }

    if(
        page >
        smartofficePagination.totalPage
    ){
        page =
            smartofficePagination.totalPage;
    }

    smartofficePagination.currentPage =
        page;
}


/* ======================================================
   NEXT PAGE
====================================================== */
export function smartofficeNextPage(){
    smartofficeSetPage(
        smartofficePagination.currentPage + 1
    );
}


/* ======================================================
   PREVIOUS PAGE
====================================================== */
export function smartofficePreviousPage(){
    smartofficeSetPage(
        smartofficePagination.currentPage - 1
    );
}


/* ======================================================
   GET PAGINATION
====================================================== */
export function smartofficeGetPagination(){
    return {
        ...smartofficePagination
    };
}


/* ======================================================
   GET PAGE DATA
====================================================== */
export function smartofficeGetPageData(
    data
){
    const start =
        (
            smartofficePagination.currentPage - 1
        )
        *
        smartofficePagination.pageSize;

    const end =
        start +
        smartofficePagination.pageSize;

    return data.slice(
        start,
        end
    );
}


/* ======================================================
   RESET PAGINATION
====================================================== */
export function smartofficeResetPagination(){
    smartofficePagination = {
        currentPage : 1,
        totalPage : 1,
        pageSize : 10,
        totalData : 0
    };
}