import { origSuff, getBaseName } from "$lib/constants";

export default function createScript(files) {
    files = files.filter(f => (
        f.selection && (f.selection !== origSuff || f.rotation)
    ));
    const cmds = [];

    for (const f of files) {
        const nameBase = getBaseName(f.name);
        const nameLvl = `${nameBase}_${f.selection}.jpg`;

        cmds.push(`touch -r "../orig/${f.name}" "./${nameLvl}"`);
    }

    return "#!/bin/bash\n" + cmds.join("\n") + "\n";
}
