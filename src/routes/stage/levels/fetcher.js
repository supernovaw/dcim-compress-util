import { origSuff, getBaseName } from "$lib/constants";

export default async function fetcher(files, levels) {
    const lvlNames = [...Object.keys(levels), origSuff];
    const promises = files.map(({ name }) => {
        const baseName = getBaseName(name);
        return lvlNames.map(async level => {
            const fullName = `${baseName}_${level}.jpg`;
            try {
                const r = await fetch("/files/workdir/" + fullName, { method: "HEAD" });
                if (!r.ok) {
                    return { fullName, name, level, error: `${r.status} (${r.statusText})` };
                }
                const type = r.headers.get("content-type");
                if (type !== "image/jpeg") {
                    return { fullName, name, level, error: `content-type is "${type}", expected "image/jpeg"` };
                }
                const size = r.headers.get("content-length");
                return { fullName, name, level, size };
            } catch (e) {
                return { fullName, name, level, error: String(e) };
            }
        });
    }).flat();
    const result = (await Promise.allSettled(promises)).map(r => r.value);
    const errors = result.filter(r => r.error);

    const sizes = new Map();
    for (const { name, level, size } of result) {
        let obj = sizes.get(name);
        if (!obj) sizes.set(name, obj = {});
        obj[level] = size;
    }
    return { sizes, errors };
}
