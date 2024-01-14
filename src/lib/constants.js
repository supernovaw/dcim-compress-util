// The script which dumps the resolutions has this file as an output option
export const resFile = "res.txt";

// Suffix (as in IMG_2024....987_orig.jpg) for original images
export const origSuff = "orig";
// Same, for thumbnails
export const thumbnailSuff = "thumbnail";

// E.g., remove the ".jpg" from "IMG_2024....987.jpg" (`sed` in Levels stage shadows this)
export const getBaseName = s => s.replace(/\.[^\.]*$/, "");
