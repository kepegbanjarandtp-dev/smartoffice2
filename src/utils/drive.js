/* ======================================================
   GET FILE ID DRIVE
====================================================== */
export function smartofficeGetDriveFileId(
  url
){
  if(!url){
    return '';
  }

  const match =
    String(url)
      .match(
        /\/d\/([^\/]+)/
      );

  return match
    ? match[1]
    : '';
}