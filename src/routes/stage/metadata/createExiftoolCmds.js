import { origSuff, getBaseName } from "$lib/constants";

export default function createScript(files, threads) {
    files = files.filter(f => (
        // has to be selected, and if selection is orig, has to be rotated
        // otherwise leave the file as it is (metadata is in tact)
        f.selection && (f.selection !== origSuff || f.rotation)
    ));
    const cmds = [];
    const totalCmds = files.length;
    const pad = String(totalCmds).length;
    let cmdIdx = 0;

    for (let i = 0; i < files.length; i++) {
        const { name, selection: lvlName } = files[i];
        const nameBase = getBaseName(name);

        const nameLvl = `${nameBase}_${lvlName}.jpg`;
        const threadNr = 1 + cmdIdx % threads;
        const cmdName = `${String(++cmdIdx).padStart(pad, " ")} / ${totalCmds}`;

        cmds.push(`[ "$T" == ${threadNr} ] && (`
            + `exiftool -overwrite_original -tagsFromFile "../orig/${name}" -ImageData= -HDRPMakerNote= -ThumbnailImage= "./${nameLvl}"`
            + ` && echo "${cmdName} success" || echo "${cmdName} failure")`);
    }
    return `#!/bin/bash\nT="$1"\n` + cmds.join("\n") + "\n";
}
