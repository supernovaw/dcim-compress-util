import { resFile } from "$lib/constants";

export default function parseSizes(text) {
    if (!text) {
        return { files: [], warnings: ["No input"] };
    }

    const lines = text
        .replaceAll(" Image Size", "\nImage Size")
        .replaceAll(" file = ", "\nfile = ")
        .split("\n");
    const warnings = [];
    const files = [];

    for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (l.length === 0) continue;

        const match = l.match(/^file = (.+)$/);
        if (!match) {
            warnings.push(`Can't parse line :${i + 1} "${l}"`);
            continue;
        }
        const fileName = match[1];
        if (fileName === resFile) continue;

        generateFileWarning(fileName, warnings);

        const resLine = lines[++i];
        const res = parseResolution(resLine);
        if (!res) {
            warnings.push(`Failed to parse resolution line :${i + 1} "${resLine}" (for file "${fileName}")`);
            continue;
        }
        files.push({ name: fileName, res });
    }
    return { files, warnings };
}

function parseResolution(line) {
    if (!line) return null;
    const match = line.trim().match(/^Image Size *: ([1-9]\d*)x([1-9]\d*)$/);
    if (!match) return null;
    return [+match[1], +match[2]];
}

const imgFormats = [".jpg", ".jpeg", ".pjpeg", ".j2000", ".png", ".gif", ".webp", ".bmp", ".tiff", ".ico", ".pcx"];

// Checks if there's anything weird and optionally pushes a string to `warnings`
function generateFileWarning(file, warnings) {
    const lower = file.toLowerCase();

    if (file.includes('"'))
        warnings.push(`File "${file}" contains a double quote. It will break things`);

    if (file.includes('$'))
        warnings.push(`File "${file}" contains a dollar sign. It will break things`);

    if (file.includes('`'))
        warnings.push(`File "${file}" contains a grave mark. It will break things`);

    if (file.startsWith(" "))
        warnings.push(`File "${file}" starts with a space`);

    if (file.endsWith(" "))
        warnings.push(`File "${file}" ends with a space`);
    else if (!imgFormats.find(fmt => lower.endsWith(fmt) && fmt))
        warnings.push(`File "${file}" doesn't have a recognized image format`);
}
