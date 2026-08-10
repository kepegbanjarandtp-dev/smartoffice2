/* ======================================================
   FORMAT TANGGAL INDONESIA
====================================================== */
/* =========================
   FORMAT DATE INDONESIA

   FUNCTION:
   Mengubah format tanggal:
   2026-05-19

   Menjadi:
   19/05/2026
========================= */
export function formatTanggalIndonesia(tanggal){

    if(!tanggal){
        return "-";
    }

    // Kalau sudah format dd/MM/yyyy, kembalikan apa adanya
    if(
        typeof tanggal === "string" &&
        /^\d{2}\/\d{2}\/\d{4}$/.test(tanggal)
    ){
        return tanggal;
    }

    const date = new Date(tanggal);

    if(Number.isNaN(date.getTime())){
        return "-";
    }

    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


/* ======================================================
   FORMAT TANGGAL INDONESIA + JAM
====================================================== */
export function smartofficeFormatTanggalIndoJamFrontend(
    date
){

    const bulan = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];

    const d =
        new Date(date);

    if(
        isNaN(d.getTime())
    ){
        return "-";
    }

    const tanggal =
        d.getDate();

    const namaBulan =
        bulan[
            d.getMonth()
        ];

    const tahun =
        d.getFullYear();

    const jam =
        String(
            d.getHours()
        ).padStart(
            2,
            "0"
        );

    const menit =
        String(
            d.getMinutes()
        ).padStart(
            2,
            "0"
        );

    return `
        ${tanggal}
        ${namaBulan}
        ${tahun}
        ${jam}:${menit}
    `
    .replace(
        /\s+/g,
        " "
    )
    .trim();

}