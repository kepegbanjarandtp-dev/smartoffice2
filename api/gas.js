/* ======================================================
   SMARTOFFICE V2
   VERCEL API PROXY → GOOGLE APPS SCRIPT
====================================================== */

const GAS_API_URL =
    "https://script.google.com/macros/s/AKfycbxqLDIwWjg9Ch5ADVEztwhcUllQoaTs-uUcNzYaWujeMkYYabsTvz7RhkSl78UNXzkz/exec";


/* ======================================================
   VERCEL API HANDLER
====================================================== */
export default async function handler(
    req,
    res
){

    /* ==================================================
       METHOD
    ================================================== */
    if(
        req.method !== "POST"
    ){

        return res.status(405).json({

            success: false,

            message:
                "Method tidak diizinkan"

        });

    }


    /* ==================================================
       REQUEST START
    ================================================== */
    const start =
        Date.now();


    console.log(
        "SMARTOFFICE PROXY REQUEST"
    );


    try{

        /* ==================================================
           BODY
        ================================================== */

        let body =
            req.body;


        /* ==================================================
           JIKA BODY STRING
        ================================================== */
        if(
            typeof body === "string"
        ){

            const params =
                new URLSearchParams(
                    body
                );

            body =
                Object.fromEntries(
                    params.entries()
                );

        }


        /* ==================================================
           VALIDASI BODY
        ================================================== */
        if(
            !body ||
            typeof body !== "object"
        ){

            return res.status(400).json({

                success: false,

                message:
                    "Request body tidak valid"

            });

        }


        /* ==================================================
           BUILD FORM DATA
        ================================================== */
        const formData =
            new URLSearchParams();


        Object.entries(body)
            .forEach(
                ([key,value]) => {

                    formData.append(
                        key,
                        value ?? ""
                    );

                }
            );


        /* ==================================================
           LOG ACTION
        ================================================== */
        console.log(
            "SMARTOFFICE PROXY ACTION:",
            body.action
        );


        /* ==================================================
           REQUEST KE GAS
        ================================================== */
        const response =
            await fetch(
                GAS_API_URL,
                {
                    method:
                        "POST",

                    body:
                        formData,

                    //redirect:
                        //"follow"
                }
            );


        /* ==================================================
           RESPONSE TIME
        ================================================== */
        const elapsed =
            Date.now() -
            start;


        console.log(
            "SMARTOFFICE PROXY GAS RESPONSE:",
            response.status,
            `${elapsed} ms`
        );


        /* ==================================================
           AMBIL TEXT
        ================================================== */
        const text =
            await response.text();


        /* ==================================================
           HTTP ERROR
        ================================================== */
        if(
            !response.ok
        ){

            console.error(
                "SMARTOFFICE PROXY GAS ERROR:",
                response.status,
                text
            );


            return res.status(
                response.status
            ).json({

                success:
                    false,

                message:
                    `GAS HTTP ${response.status}`,

                data:
                    {}

            });

        }


        /* ==================================================
           PARSE JSON
        ================================================== */
        let result;

        try{

            result =
                JSON.parse(
                    text
                );

        }
        catch(error){

            console.error(
                "SMARTOFFICE PROXY INVALID JSON:",
                text
            );


            return res.status(502).json({

                success:
                    false,

                message:
                    "Response GAS bukan JSON",

                data:
                    {}

            });

        }


        /* ==================================================
           SUCCESS
        ================================================== */
        console.log(
            "SMARTOFFICE PROXY SUCCESS:",
            body.action,
            `${Date.now() - start} ms`
        );


        return res.status(200).json(
            result
        );

    }
    catch(error){

        /* ==================================================
           ERROR
        ================================================== */
        console.error(
            "SMARTOFFICE PROXY ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                "Proxy gagal menghubungi server GAS",

            data:
                {}

        });

    }

}