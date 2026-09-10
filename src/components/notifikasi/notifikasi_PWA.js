import {
    smartofficeNavigate
} from '../../core/router.js';

// ============================================================
// SMART OFFICE V2.1
// NOTIFICATION PWA
// ============================================================
import './notifikasi_PWA.css';

import {
    smartofficeApi
} from '../../core/api.js';

import {
    smartofficeGetSession
} from '../../core/session.js';


// ============================================================
// GLOBAL
// ============================================================
let smartofficeNotificationPanelElement = null;
let smartofficeNotificationCache = null;
let smartofficeNotificationOutsideClickHandler = null;
let smartofficeNotificationEscapeHandler = null;
let smartofficeNotificationPreviousActiveButton = null;


// ============================================================
// TOGGLE NOTIFICATION PANEL
// ============================================================
export function smartofficeToggleNotificationPanel(){
    if(
        smartofficeNotificationPanelElement
    ){
        smartofficeCloseNotificationPanel();

        return;
    }

    smartofficeShowNotificationPanel();
}


// ============================================================
// SHOW NOTIFICATION PANEL
// ============================================================
async function smartofficeShowNotificationPanel(){

    // --------------------------------------------------------
    // JIKA SUDAH ADA
    // --------------------------------------------------------
    if(
        smartofficeNotificationPanelElement
    ){

        return;
    }

    // ========================================================
    // CREATE PANEL
    // ========================================================
    const panel =
        document.createElement(
            'div'
        );

    panel.id =
        'smartofficeNotificationPanel';

    panel.className =
        'smartoffice-notification-panel';

    // ========================================================
    // PANEL HEADER
    // ========================================================
    const header =
        document.createElement(
            'div'
        );

    header.className =
        'smartoffice-notification-header';

    // --------------------------------------------------------
    // TITLE
    // --------------------------------------------------------
    const title =
        document.createElement(
            'div'
        );

    title.className =
        'smartoffice-notification-title';

    title.innerHTML = `
        <span class="smartoffice-notification-title-icon">
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path
                    d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                ></path>
                <path
                    d="M13.73 21a2 2 0 0 1-3.46 0"
                ></path>
            </svg>
        </span>
        <span>
            Notifikasi
        </span>
    `;

    // --------------------------------------------------------
    // CLOSE
    // --------------------------------------------------------
    const closeButton =
        document.createElement(
            'button'
        );

    closeButton.type =
        'button';

    closeButton.className =
        'smartoffice-notification-close';

    closeButton.setAttribute(
        'aria-label',
        'Tutup notifikasi'
    );

    closeButton.innerHTML = `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <line
                x1="18"
                y1="6"
                x2="6"
                y2="18"
            ></line>
            <line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
            ></line>
        </svg>
    `;

    closeButton.addEventListener(
        'click',
        function(){
            smartofficeCloseNotificationPanel();
        }
    );

    header.appendChild(
        title
    );

    header.appendChild(
        closeButton
    );

    // ========================================================
    // PANEL CONTENT
    // ========================================================
    const content =
        document.createElement(
            'div'
        );

    content.className =
        'smartoffice-notification-content';

    // --------------------------------------------------------
    // LOADING
    // --------------------------------------------------------
    content.innerHTML = `
        <div class="smartoffice-notification-empty">
            <div class="smartoffice-notification-empty-icon">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path
                        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                    ></path>
                    <path
                        d="M13.73 21a2 2 0 0 1-3.46 0"
                    ></path>
                </svg>
            </div>

            <div class="smartoffice-notification-empty-title">
                Memuat notifikasi...
            </div>

            <div class="smartoffice-notification-empty-text">
                Mohon tunggu sebentar.
            </div>
        </div>
    `;

    // ========================================================
    // APPEND
    // ========================================================
    panel.appendChild(
        header
    );

    panel.appendChild(
        content
    );

    document.body.appendChild(
        panel
    );

    // ========================================================
    // SAVE GLOBAL
    // ========================================================
    smartofficeNotificationPanelElement =
        panel;

    // ========================================================
    // ACTIVE NAVBAR
    // ========================================================
    smartofficeSetNotificationNavbarActive();

    // ========================================================
    // EVENT OUTSIDE CLICK
    // ========================================================
    smartofficeNotificationOutsideClickHandler =
        function(event){
            if(
                !smartofficeNotificationPanelElement
            ){

                return;
            }

            const clickedInsidePanel =
                smartofficeNotificationPanelElement
                    .contains(
                        event.target
                    );

            const clickedNotificationButton =
                document
                    .getElementById(
                        'smartofficeNotificationButton'
                    )
                    ?.contains(
                        event.target
                    );
            if(
                !clickedInsidePanel &&
                !clickedNotificationButton
            ){
                smartofficeCloseNotificationPanel();
            }
        };

    setTimeout(
        function(){
            document.addEventListener(
                'click',
                smartofficeNotificationOutsideClickHandler
            );
        },
        0
    );

    // ========================================================
    // ESCAPE
    // ========================================================
    smartofficeNotificationEscapeHandler =
        function(event){
            if(
                event.key === 'Escape'
            ){
                smartofficeCloseNotificationPanel();
            }
        };

    document.addEventListener(
        'keydown',
        smartofficeNotificationEscapeHandler
    );

    // ========================================================
    // LOAD DATA
    // ========================================================
    await smartofficeLoadNotifications(
        content
    );
}


// ============================================================
// LOAD NOTIFICATION
// ============================================================
async function smartofficeLoadNotifications(content){

    try{
        const session =
            smartofficeGetSession();

        if(!session){
            smartofficeRenderNotificationError(
                content,
                'Sesi pengguna tidak ditemukan.'
            );
            return;
        }

        const nip =
            String(session.nip || '').trim();

        const role =
            String(session.role || 'USER')
                .trim()
                .toUpperCase();
        if(!nip){
            smartofficeRenderNotificationError(
                content,
                'NIP pengguna tidak ditemukan.'
            );
            return;
        }

        /* ==================================================
           JIKA CACHE SUDAH ADA
        ================================================== */
        if(
            smartofficeNotificationCache &&
            smartofficeNotificationCache.nip === nip &&
            smartofficeNotificationCache.role === role
        ){
            smartofficeRenderNotifications(
                content,
                smartofficeNotificationCache.notifications
            );

            return;
        }

        /* ==================================================
           REQUEST KE GAS
        ================================================== */
        console.log(
            'SMARTOFFICE LOAD NOTIFICATIONS:',
            {
                nip,
                role
            }
        );

        const response =
            await smartofficeApi(
                'smartofficeGetNotifications',
                {
                    nip,
                    role
                }
            );

        console.log(
            'SMARTOFFICE NOTIFICATION RESPONSE:',
            response
        );

        let data =
            response?.data ?? response;

        if(
            data?.data
        ){
            data =
                data.data;
        }

        const notifications =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(
                        data?.notifications
                    )
                        ? data.notifications
                        : []
                );

        /* ==================================================
           SIMPAN CACHE
        ================================================== */
        smartofficeNotificationCache = {
            nip,
            role,
            notifications,
            unreadCount:
                data?.unreadCount ??
                notifications.length
        };

        /* ==================================================
           RENDER
        ================================================== */
        if(
            notifications.length === 0
        ){
            smartofficeRenderNotificationEmpty(
                content
            );

            return;
        }

        smartofficeRenderNotifications(
            content,
            notifications
        );
    }
    catch(error){
        console.error(
            'SMARTOFFICE LOAD NOTIFICATIONS ERROR:',
            error
        );

        smartofficeRenderNotificationError(
            content,
            error?.message ||
            'Gagal mengambil notifikasi.'
        );
    }
}


// ============================================================
// RENDER NOTIFICATION LIST
// ============================================================
function smartofficeRenderNotifications(
    content,
    notifications
){
    content.innerHTML = '';

    const wrapper =
        document.createElement(
            'div'
        );

    wrapper.className =
        'smartoffice-notification-list';

    notifications.forEach(
        function(notification){
            const item =
                document.createElement(
                    'div'
                );

            item.className =
                'smartoffice-notification-item';

            // ------------------------------------------------
            // ICON
            // ------------------------------------------------
            const icon =
                document.createElement(
                    'div'
                );

            icon.className =
                'smartoffice-notification-item-icon ' +
                smartofficeGetNotificationIconClass(
                    notification
                );

            icon.innerHTML =
                smartofficeGetNotificationIcon(
                    notification?.icon
                );

            // ------------------------------------------------
            // BODY
            // ------------------------------------------------
            const body =
                document.createElement(
                    'div'
                );

            body.className =
                'smartoffice-notification-item-body';

            const title =
                document.createElement(
                    'div'
                );

            title.className =
                'smartoffice-notification-item-title';

            title.textContent =
                notification?.title ||
                'Notifikasi';

            const message =
                document.createElement(
                    'div'
                );

            message.className =
                'smartoffice-notification-item-message';

            message.textContent =
                notification?.message ||
                'Ada informasi baru.';

            const time =
                document.createElement(
                    'div'
                );

            time.className =
                'smartoffice-notification-item-time';

            time.textContent =
                smartofficeFormatNotificationTime(
                    notification?.time
                );

            body.appendChild(
                title
            );

            body.appendChild(
                message
            );

            body.appendChild(
                time
            );

            // ------------------------------------------------
            // CLICK
            // ------------------------------------------------
            if(
                notification?.target
            ){
                item.classList.add(
                    'smartoffice-notification-clickable'
                );

                item.addEventListener(
                    'click',
                    function(){

                        smartofficeHandleNotificationClick(
                            notification
                        );
                    }
                );
            }

            item.appendChild(
                icon
            );

            item.appendChild(
                body
            );

            wrapper.appendChild(
                item
            );
        }
    );

    content.appendChild(
        wrapper
    );
}


// ============================================================
// EMPTY
// ============================================================
function smartofficeRenderNotificationEmpty(
    content
){
    content.innerHTML = `
        <div class="smartoffice-notification-empty">
            <div class="smartoffice-notification-empty-icon">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path
                        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                    ></path>

                    <path
                        d="M13.73 21a2 2 0 0 1-3.46 0"
                    ></path>
                </svg>
            </div>

            <div class="smartoffice-notification-empty-title">
                Belum ada notifikasi
            </div>

            <div class="smartoffice-notification-empty-text">
                Notifikasi baru akan muncul di sini.
            </div>
        </div>
    `;
}


// ============================================================
// ERROR
// ============================================================
function smartofficeRenderNotificationError(
    content,
    message
){
    content.innerHTML = `
        <div class="smartoffice-notification-empty">
            <div class="smartoffice-notification-empty-icon">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                    ></circle>
                    <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                    ></line>
                    <line
                        x1="12"
                        y1="16"
                        x2="12.01"
                        y2="16"
                    ></line>
                </svg>
            </div>
            <div class="smartoffice-notification-empty-title">
                Gagal memuat notifikasi
            </div>
            <div class="smartoffice-notification-empty-text">
                ${smartofficeEscapeHtml(
                    message ||
                    'Terjadi kesalahan.'
                )}
            </div>
        </div>
    `;
}


// ============================================================
// ICON CLASS
// ============================================================
function smartofficeGetNotificationIconClass(
    notification
){
    const type =
        String(
            notification?.type || ''
        ).toLowerCase();

    const category =
        String(
            notification?.category || ''
        ).toLowerCase();
    if(
        category.includes(
            'ditolak'
        ) ||
        category.includes(
            'rejected'
        )
    ){

        return 'is-danger';
    }

    if(
        category.includes(
            'disetujui'
        ) ||
        category.includes(
            'approved'
        ) ||
        category.includes(
            'diverifikasi'
        )
    ){

        return 'is-success';
    }

    if(
        type === 'dokumen'
    ){

        return 'is-document';
    }

    return 'is-info';
}


// ============================================================
// ICON SVG
// ============================================================
function smartofficeGetNotificationIcon(
    icon
){
    switch(
        String(
            icon || ''
        ).toLowerCase()
    ){
        case 'check':
        case 'file-check':

            return `
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path
                        d="M20 6L9 17l-5-5"
                    ></path>
                </svg>
            `;

        case 'x':
        case 'file-x':

            return `
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <line
                        x1="18"
                        y1="6"
                        x2="6"
                        y2="18"
                    ></line>
                    <line
                        x1="6"
                        y1="6"
                        x2="18"
                        y2="18"
                    ></line>
                </svg>
            `;

        case 'calendar':

            return `
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect
                        x="3"
                        y="4"
                        width="18"
                        height="17"
                        rx="2"
                    ></rect>
                    <line
                        x1="16"
                        y1="2"
                        x2="16"
                        y2="6"
                    ></line>
                    <line
                        x1="8"
                        y1="2"
                        x2="8"
                        y2="6"
                    ></line>
                    <line
                        x1="3"
                        y1="10"
                        x2="21"
                        y2="10"
                    ></line>
                </svg>
            `;

        default:

            return `
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path
                        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                    ></path>

                    <path
                        d="M13.73 21a2 2 0 0 1-3.46 0"
                    ></path>
                </svg>
            `;
    }
}


// ============================================================
// FORMAT TIME
// ============================================================
function smartofficeFormatNotificationTime(
    value
){
    if(
        !value
    ){
        return '';
    }

    const date =
        new Date(
            value
        );
    if(
        isNaN(
            date.getTime()
        )
    ){
        return '';
    }

    const sekarang =
        new Date();

    const selisih =
        sekarang.getTime() -
        date.getTime();

    if(
        selisih < 0
    ){
        return 'Baru saja';
    }

    const menit =
        Math.floor(
            selisih /
            60000
        );
    if(
        menit < 1
    ){
        return 'Baru saja';
    }

    if(
        menit < 60
    ){
        return menit +
            ' menit lalu';
    }

    const jam =
        Math.floor(
            menit /
            60
        );
    if(
        jam < 24
    ){
        return jam +
            ' jam lalu';
    }

    const hari =
        Math.floor(
            jam /
            24
        );
    if(
        hari === 1
    ){
        return 'Kemarin';
    }

    return hari +
        ' hari lalu';
}


// ============================================================
// CLICK NOTIFICATION
// ============================================================
function smartofficeHandleNotificationClick(
    notification
){
    const target =
        notification?.target;

    // --------------------------------------------------------
    // TUTUP PANEL
    // --------------------------------------------------------
    smartofficeCloseNotificationPanel();

    // --------------------------------------------------------
    // CUTI
    // --------------------------------------------------------
    if(
        target === 'cuti'
    ){
        /*
         * Untuk sekarang cukup buka halaman Cuti.
         * Detail ID dapat kita sambungkan kemudian jika
         * halaman Cuti sudah memiliki deep-link/detail route.
         */
        smartofficeNavigate('cuti');
        return;
    }

    // --------------------------------------------------------
    // APPROVAL
    // --------------------------------------------------------
    if(
        target === 'approval'
    ){
        smartofficeNavigate('approval');

        return;
    }

    // --------------------------------------------------------
    // DOKUMEN SAYA
    // --------------------------------------------------------
    if(
        target === 'dokumen-saya'
    ){
        smartofficeNavigate('dokumen-saya');
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================
function smartofficeEscapeHtml(
    value
){
    return String(
        value || ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
}


// ============================================================
// SET NOTIFICATION NAVBAR ACTIVE
// ============================================================
function smartofficeSetNotificationNavbarActive(){
    const buttons =
        document.querySelectorAll(
            '.smartoffice-mobile-navbar-item'
        );

    smartofficeNotificationPreviousActiveButton =
        document.querySelector(
            '.smartoffice-mobile-navbar-item.active'
        );

    buttons.forEach(
        function(button){
            button.classList.remove(
                'active'
            );
        }
    );

    const notificationButton =
        document.getElementById(
            'smartofficeNotificationButton'
        );
    if(
        notificationButton
    ){
        notificationButton.classList.add(
            'active'
        );
    }
}


// ============================================================
// UPDATE NOTIFICATION BADGE
// ============================================================
export function smartofficeUpdateNotificationBadge(
    count = 0
){
    const badge =
        document.getElementById(
            'smartofficeNotificationBadge'
        );
    if(
        !badge
    ){

        return;
    }

    const total =
        Math.max(
            0,
            Number(count) || 0
        );
    if(
        total <= 0
    ){
        badge.textContent = '0';
        badge.hidden = true;
        return;
    }

    badge.textContent =
        total > 99
            ? '99+'
            : String(total);

    badge.hidden = false;

    const button =
        document.getElementById(
            'smartofficeNotificationButton'
        );
    if(
        button
    ){
        button.classList.add(
            'smartoffice-has-notification-badge'
        );
    }
}


// ============================================================
// LOAD NOTIFICATION CACHE
// Dipanggil 1x setelah login.
// Tidak dipanggil oleh navbar.
// ============================================================
export async function smartofficeLoadNotificationCache(){

    try{

        const session =
            smartofficeGetSession();

        if(!session){
            return;
        }

        const nip =
            String(session.nip || '').trim();

        const role =
            String(session.role || 'USER')
                .trim()
                .toUpperCase();

        if(!nip){
            return;
        }

        // Jangan request kalau cache akun yang sama masih tersedia
        if(
            smartofficeNotificationCache &&
            smartofficeNotificationCache.nip === nip &&
            smartofficeNotificationCache.role === role
        ){
            smartofficeUpdateNotificationBadge(
                smartofficeNotificationCache.unreadCount
            );

            return;
        }

        console.log(
            'SMARTOFFICE LOAD NOTIFICATION CACHE:',
            { nip, role }
        );

        const response =
            await smartofficeApi(
                'smartofficeGetNotifications',
                {
                    nip,
                    role
                }
            );

        let data =
            response?.data ?? response;

        if(data?.data){
            data = data.data;
        }

        const notifications =
            Array.isArray(data?.notifications)
                ? data.notifications
                : [];

        const unreadCount =
            Number(
                data?.unreadCount ??
                notifications.length
            );

        /*
         * PENTING:
         * Pastikan response masih untuk session yang sama.
         * Kalau user sudah logout/login akun lain saat request
         * belum selesai, hasil akun lama jangan dimasukkan cache.
         */
        const currentSession =
            smartofficeGetSession();

        const currentNip =
            String(currentSession?.nip || '').trim();

        const currentRole =
            String(currentSession?.role || 'USER')
                .trim()
                .toUpperCase();

        if(
            currentNip !== nip ||
            currentRole !== role
        ){
            return;
        }

        // ====================================================
        // SIMPAN CACHE
        // ====================================================
        smartofficeNotificationCache = {
            nip,
            role,
            notifications,
            unreadCount
        };

        // ====================================================
        // UPDATE BADGE
        // ====================================================
        smartofficeUpdateNotificationBadge(
            unreadCount
        );

    }
    catch(error){

        console.warn(
            'Load notification cache gagal:',
            error
        );

    }
}


// ============================================================
// REFRESH NOTIFICATION BADGE
// HANYA MEMBACA CACHE
// TIDAK ADA REQUEST KE GAS
// ============================================================
export function smartofficeRefreshNotificationBadge(){

    const session =
        smartofficeGetSession();

    if(!session){
        smartofficeUpdateNotificationBadge(0);
        return;
    }

    const nip =
        String(session.nip || '').trim();

    const role =
        String(session.role || 'USER')
            .trim()
            .toUpperCase();

    if(
        !smartofficeNotificationCache ||
        smartofficeNotificationCache.nip !== nip ||
        smartofficeNotificationCache.role !== role
    ){
        smartofficeUpdateNotificationBadge(0);
        return;
    }

    smartofficeUpdateNotificationBadge(
        smartofficeNotificationCache.unreadCount
    );
}


// ============================================================
// CLOSE NOTIFICATION PANEL
// ============================================================
function smartofficeCloseNotificationPanel(){
    if(
        !smartofficeNotificationPanelElement
    ){
        return;
    }

    // --------------------------------------------------------
    // REMOVE PANEL
    // --------------------------------------------------------
    smartofficeNotificationPanelElement.remove();
    smartofficeNotificationPanelElement =
        null;

    // --------------------------------------------------------
    // REMOVE OUTSIDE CLICK
    // --------------------------------------------------------
    if(
        smartofficeNotificationOutsideClickHandler
    ){
        document.removeEventListener(
            'click',
            smartofficeNotificationOutsideClickHandler
        );

        smartofficeNotificationOutsideClickHandler =
            null;
    }

    // --------------------------------------------------------
    // REMOVE ESCAPE
    // --------------------------------------------------------
    if(
        smartofficeNotificationEscapeHandler
    ){
        document.removeEventListener(
            'keydown',
            smartofficeNotificationEscapeHandler
        );

        smartofficeNotificationEscapeHandler =
            null;
    }

    // --------------------------------------------------------
    // RESTORE ACTIVE NAVBAR ITEM
    // --------------------------------------------------------
    if(
        smartofficeNotificationPreviousActiveButton
    ){
        smartofficeNotificationPreviousActiveButton.classList.add(
            'active'
        );
    }

    smartofficeNotificationPreviousActiveButton =
        null;
}


// ============================================================
// REFRESH NOTIFICATION PANEL
// ============================================================
export async function smartofficeRefreshNotifications(){
    if(
        !smartofficeNotificationPanelElement
    ){
        return;
    }

    const content =
        smartofficeNotificationPanelElement
            .querySelector(
                '.smartoffice-notification-content'
            );
    if(
        !content
    ){
        return;
    }

    await smartofficeLoadNotifications(
        content
    );
}


/* ============================================================
   DESTROY NOTIFICATION STATE
============================================================ */
export function smartofficeDestroyNotification(){

    // --------------------------------------------------------
    // REMOVE PANEL
    // --------------------------------------------------------
    if(
        smartofficeNotificationPanelElement
    ){

        smartofficeNotificationPanelElement.remove();

        smartofficeNotificationPanelElement =
            null;
    }


    // --------------------------------------------------------
    // REMOVE OUTSIDE CLICK
    // --------------------------------------------------------
    if(
        smartofficeNotificationOutsideClickHandler
    ){

        document.removeEventListener(
            'click',
            smartofficeNotificationOutsideClickHandler
        );

        smartofficeNotificationOutsideClickHandler =
            null;
    }


    // --------------------------------------------------------
    // REMOVE ESCAPE
    // --------------------------------------------------------
    if(
        smartofficeNotificationEscapeHandler
    ){

        document.removeEventListener(
            'keydown',
            smartofficeNotificationEscapeHandler
        );

        smartofficeNotificationEscapeHandler =
            null;
    }


    // --------------------------------------------------------
    // CLEAR CACHE
    // --------------------------------------------------------
    smartofficeNotificationCache =
        null;


    // --------------------------------------------------------
    // RESET ACTIVE BUTTON
    // --------------------------------------------------------
    smartofficeNotificationPreviousActiveButton =
        null;


    // --------------------------------------------------------
    // RESET BADGE
    // --------------------------------------------------------
    const badge =
        document.getElementById(
            'smartofficeNotificationBadge'
        );

    if(badge){

        badge.textContent = '0';

        badge.hidden = true;
    }

}