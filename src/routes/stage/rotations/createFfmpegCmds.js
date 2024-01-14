import { origSuff, getBaseName } from "$lib/constants";

const rotateFilter = {
    90: "-vf transpose=clock",
    180: "-vf transpose=clock,transpose=clock", // this is pretty silly
    270: "-vf transpose=cclock",
};

export default function createScript(files, levels, threads) {
    files = files.filter(f => f.rotation);
    const cmds = [];
    const totalCmds = files.length * (Object.keys(levels).length + 1); // +1 for orig
    const pad = String(totalCmds).length;
    let cmdIdx = 0;

    // Emit commands to re-compress each rotated file
    for (let i = 0; i < files.length; i++) {
        const { name, res: [wOrig, hOrig], rotation } = files[i];
        const invertAspectRatio = (rotation % 180) !== 0;
        const wRot = invertAspectRatio ? hOrig : wOrig;
        const hRot = invertAspectRatio ? wOrig : hOrig;
        const rotVf = rotateFilter[rotation];

        const nameBase = getBaseName(name);
        const isPortrait = hRot > wRot;
        const ratio = Math.max(wRot, hRot) / Math.min(wRot, hRot);

        { // Rotate the original (with -q:v 2 since we have to transcode it, try to preserve quality)
            const nameOrig = `${nameBase}_${origSuff}.jpg`;
            const threadNr = 1 + cmdIdx % threads;
            const cmdName = `${String(++cmdIdx).padStart(pad, " ")} / ${totalCmds}`;
            cmds.push(`[ "$T" == ${threadNr} ] && (`
                + `ffmpeg -i "../orig/${name}" -q:v 2 ${rotVf} "./${nameOrig}" -y`
                + ` 2> /dev/null && echo "${cmdName} success" || echo "${cmdName} failure")`);
        }
        // Rotate compressed versions
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
                + `ffmpeg -i "../orig/${name}" -s ${size} -q:v ${l.q} ${rotVf} "./${nameLvl}" -y`
                + ` 2> /dev/null && echo "${cmdName} success" || echo "${cmdName} failure")`);
        }
    }
    return `#!/bin/bash\nT="$1"\n` + cmds.join("\n") + "\n";
}
