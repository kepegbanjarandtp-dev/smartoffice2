/* ======================================================
   CONVERT FILE TO BASE64
====================================================== */
export function smartofficeConvertFileToBase64(
    file
){
    return new Promise(
        function(resolve,reject){

            const reader =
                new FileReader();

            reader.onload =
                function(){
                    resolve(
                        reader.result
                            .split(",")[1]
                    );
                };

            reader.onerror =
                reject;

            reader.readAsDataURL(
                file
            );
        }
    );
}