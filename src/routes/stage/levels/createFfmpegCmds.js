import { origSuff, thumbnailSuff, getBaseName } from "$lib/constants";

export default function createScript(files, levels, threads) {
    levels = { ...levels, [thumbnailSuff]: { height: 100, q: 10 } };
    const cmds = [];
    const totalCmds = files.length * Object.keys(levels).length;
    const pad = String(totalCmds).length;
    let cmdIdx = 0;

    for (let i = 0; i < files.length; i++) {
        const { name, res: [w, h] } = files[i];

        const nameBase = getBaseName(name);
        const nameOrig = nameBase + `_${origSuff}.jpg`;
        const isPortrait = h > w;
        const ratio = Math.max(w, h) / Math.min(w, h);

        for (const lvlName of Object.keys(levels)) {
            const l = levels[lvlName];
            const outputResShrt = l.height;
            const outputResLong = Math.round(l.height * ratio);
            const outputW = isPortrait ? outputResShrt : outputResLong;
            const outputH = isPortrait ? outputResLong : outputResShrt;
            const size = `${outputW}x${outputH}`;
            const nameLvl = `${nameBase}_${lvlName}.jpg`;
            const threadNr = 1 + cmdIdx % threads;
            const cmdName = `${String(++cmdIdx).padStart(pad, " ")} / ${totalCmds}`;

            cmds.push(`[ "$T" == ${threadNr} ] && (`
                + `ffmpeg -i "./${nameOrig}" -s ${size} -q:v ${l.q} "./${nameLvl}" -y`
                + ` 2> /dev/null && echo "${cmdName} success" || echo "${cmdName} failure")`);
        }
    }
    return `#!/bin/bash\nT="$1"\n` + cmds.join("\n") + "\n";
}
