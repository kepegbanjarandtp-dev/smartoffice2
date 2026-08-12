/* ======================================================
   SMARTOFFICE V2
   VERCEL API PROXY → GOOGLE APPS SCRIPT
====================================================== */

const GAS_API_URL =
    "https://script.google.com/macros/s/AKfycbxqLDIwWjg9Ch5ADVEztwhcUllQoaTs-uUcNzYaWujeMkYYabsTvz7RhkSl78UNXzkz/exec";


/* ======================================================
   VERCEL API HANDLER
====================================================== */

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan"
        });
    }

    const start = Date.now();

    try {

        /* ==================================================
           BODY
        ================================================== */

        let body = req.body;

        if (typeof body === "string") {
            body = Object.fromEntries(
                new URLSearchParams(body).entries()
            );
        }

        if (!body || typeof body !== "object") {
            return res.status(400).json({
                success: false,
                message: "Request body tidak valid"
            });
        }


        /* ==================================================
           BUILD FORM DATA
        ================================================== */

        const formData = new URLSearchParams();

        Object.entries(body).forEach(([key, value]) => {
            formData.append(key, value ?? "");
        });


        console.log(
            "SMARTOFFICE PROXY REQUEST:",
            body.action
        );


        /* ==================================================
           REQUEST KE GAS
           JANGAN AUTO FOLLOW REDIRECT
        ================================================== */

        const gasResponse = await fetch(
            GAS_API_URL,
            {
                method: "POST",
                body: formData,
                redirect: "manual",
                cache: "no-store"
            }
        );


        console.log(
            "SMARTOFFICE GAS STATUS:",
            gasResponse.status,
            `${Date.now() - start} ms`
        );


        /* ==================================================
           CEK REDIRECT GAS
        ================================================== */

        if (
            gasResponse.status >= 300 &&
            gasResponse.status < 400
        ) {

            const location =
                gasResponse.headers.get("location");


            console.log(
                "SMARTOFFICE GAS REDIRECT:",
                location
            );


            if (!location) {

                return res.status(502).json({
                    success: false,
                    message:
                        "GAS mengirim redirect tanpa lokasi",
                    data: {}
                });

            }


            /* ==============================================
               AMBIL RESPONSE DARI GOOGLE REDIRECT
            ============================================== */

            const redirectResponse =
                await fetch(
                    location,
                    {
                        method: "GET",
                        redirect: "manual",
                        cache: "no-store"
                    }
                );


            console.log(
                "SMARTOFFICE REDIRECT STATUS:",
                redirectResponse.status,
                `${Date.now() - start} ms`
            );


            const text =
                await redirectResponse.text();


            if (!redirectResponse.ok) {

                console.error(
                    "SMARTOFFICE REDIRECT ERROR:",
                    redirectResponse.status,
                    text
                );

                return res.status(502).json({
                    success: false,
                    message:
                        `Response Google ${redirectResponse.status}`,
                    data: {}
                });

            }


            /* ==============================================
               PARSE JSON
            ============================================== */

            let result;

            try {

                result =
                    JSON.parse(text);

            } catch (error) {

                console.error(
                    "SMARTOFFICE INVALID JSON:",
                    text
                );

                return res.status(502).json({
                    success: false,
                    message:
                        "Response GAS bukan JSON",
                    data: {}
                });

            }


            console.log(
                "SMARTOFFICE PROXY SUCCESS:",
                body.action,
                `${Date.now() - start} ms`
            );


            res.setHeader(
                "Cache-Control",
                "no-store, no-cache, must-revalidate"
            );


            return res.status(200).json(result);

        }


        /* ==================================================
           JIKA GAS LANGSUNG 200
        ================================================== */

        if (gasResponse.ok) {

            const text =
                await gasResponse.text();

            let result;

            try {

                result =
                    JSON.parse(text);

            } catch (error) {

                console.error(
                    "SMARTOFFICE DIRECT INVALID JSON:",
                    text
                );

                return res.status(502).json({
                    success: false,
                    message:
                        "Response GAS bukan JSON",
                    data: {}
                });

            }


            console.log(
                "SMARTOFFICE PROXY DIRECT SUCCESS:",
                body.action,
                `${Date.now() - start} ms`
            );


            res.setHeader(
                "Cache-Control",
                "no-store, no-cache, must-revalidate"
            );


            return res.status(200).json(result);

        }


        /* ==================================================
           GAS HTTP ERROR
        ================================================== */

        const errorText =
            await gasResponse.text();

        console.error(
            "SMARTOFFICE GAS ERROR:",
            gasResponse.status,
            errorText
        );


        return res.status(502).json({
            success: false,
            message:
                `GAS HTTP ${gasResponse.status}`,
            data: {}
        });


    } catch (error) {

        console.error(
            "SMARTOFFICE PROXY ERROR:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Proxy gagal menghubungi server GAS",
            data: {}
        });

    }

}