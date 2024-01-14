<script>
    import { resFile } from "$lib/constants";
    import state from "$lib/state";
    import parseSizes from "./parseSizes";

    const cmd = {
        checkOrnt: `ls -A | while read file; do
    exiftool "./$file" \\
        | grep -E '^Orientation *: Horizontal \\(normal\\)$' > /dev/null \\
        || echo "possibly broken orientation in $file";
done; echo done`,
        fetchRes: `ls -A | while read file; do
    echo "file = $file";
    exiftool "./$file" \\
        | grep -E '^Image Size *: ';
done`,
    };

    const saveOptions = [
        { desc: "output to terminal (may clutter it)", cmd: "" },
        { desc: "save to file (quietly)", cmd: " > " + resFile },
        { desc: "save to file (and also display)", cmd: " | tee " + resFile },
        { desc: "save to clipboard (Linux/Xorg)", cmd: " | xclip -sel c" },
        {
            desc: "save to clipboard (Android/Termux)",
            cmd: " | termux-clipboard-set",
        },
        { desc: "save to clipboard (macOS)", cmd: " | pbcopy" },
    ];
    const w = typeof window !== "undefined";
    const isMac = w && window.navigator.userAgent.includes("Mac OS");
    const isAnd = w && window.navigator.userAgent.includes("Android");
    const isX11 = w && window.navigator.userAgent.includes("X11;");
    let selectedOptIdx = isX11 ? 3 : isAnd ? 4 : isMac ? 5 : 2;

    let parseStatus = "";
    let parseStatusColor = "#fff";
    let parseWarnings = [];
    let parsedFiles = [];
    let resCounts = [];
    let nullifyProceedWarning = false;
    $: qChosenFilesNum = $state.files?.filter((f) => f.selection).length;

    let bottomDiv;
    function scrollToBottom() {
        requestAnimationFrame(() =>
            bottomDiv.scrollIntoView({ behavior: "smooth" }),
        );
    }

    async function handleParseFromClipboard() {
        const { files, warnings } = parseSizes(await getClipboardText());
        const fc = files.length;
        const wc = warnings.length;

        let txt, clr;
        if (fc === 0 && wc === 0) {
            clr = "err";
            txt = "No files were parsed. Is your clipboard empty?";
        } else if (fc === 0) {
            clr = "err";
            txt = `No files were parsed, ${wc} warning(s) generated.`;
        } else if (wc > 0) {
            clr = "wrn";
            txt = `${fc} file(s) were parsed with ${wc} warning(s).`;
        } else {
            clr = "ok";
            txt = `${fc} file(s) were successfully parsed. Please do verify the image count.`;
        }
        parseStatus = txt;
        parseStatusColor = `var(--status-${clr})`;
        parseWarnings = warnings;
        parsedFiles = files;
        resCounts = [];
        nullifyProceedWarning = false;
        scrollToBottom();
    }

    async function getClipboardText() {
        try {
            return await window.navigator.clipboard.readText();
        } catch (e) {
            return prompt(`Failed to get clipboard contents (${e})
Use this fallback to manually paste in the result.`);
        }
    }

    function countResolutions(files) {
        const countedResolutions = [];
        files.forEach(({ res }) => {
            const sideLong = Math.max(...res);
            const sideShrt = Math.min(...res);
            const isPortrait = res[0] === sideShrt;
            const resStr = sideLong + "×" + sideShrt;
            let occ = countedResolutions.find((r) => r.res === resStr);
            if (!occ) {
                countedResolutions.push(
                    (occ = {
                        res: resStr,
                        total: 0,
                        landscape: 0,
                        portrait: 0,
                    }),
                );
            }
            occ.total++;
            if (isPortrait) occ.portrait++;
            else occ.landscape++;
        });
        countedResolutions.sort((a, b) => b.total - a.total);
        return countedResolutions;
    }

    function proceedWithFiles() {
        $state.files = parsedFiles;
        resCounts = countResolutions(parsedFiles);
        scrollToBottom();
        nullifyProceedWarning = true;
    }
</script>

<main>
    <h1>Step 2: orientations and sizes</h1>
    <h2>Verify orientations</h2>
    <p>
        Some cameras produce JPEG images that are stored internally in one
        orientation (e.g. horizontal) but are displayed as another (e.g.
        vertical) by using the "orientation" EXIF metadata property. This can
        lead to inconsistent, distorted transcoding, which is why I've decided
        to manually handle that if it ever happens again. In order to ensure
        that no image has an unusual orientation property set, run the following
        command that uses <code>exiftool</code>, from inside the
        <code>/static/files/orig/</code> directory. In case everything is OK, no
        file names will be printed.
    </p>
    <pre><code>{cmd.checkOrnt}</code></pre>
    <h2>Extract sizes</h2>
    <p>
        In order for this program to generate <code>ffmpeg</code> commands that compress
        the images to different quality levels, it needs to know their resolutions.
        The command below extracts the required information. It can be saved to a
        file first, or copied directly into the clipboard.
    </p>
    <p>
        If you use an option that doesn't simultaneously show output, it might
        seem that the command hangs. For a lot of images, it might take a while.
        If you're impatient, use the third option. Also note that if you use the
        save to clipboard option, the clipboard will be populated only at the
        time all resolutions are extracted.
    </p>
    {#each saveOptions as opt, i}
        <label>
            <input
                type="radio"
                name="1"
                value={i}
                bind:group={selectedOptIdx}
            />
            {opt.desc}
        </label>
    {/each}
    <pre><code>{cmd.fetchRes + saveOptions[selectedOptIdx].cmd}</code></pre>
    <p>
        If you didn't use a direct copy to clipboard option, copy the resulting
        text into the clipboard yourself. The button below will read clipboard
        contents and parse the extracted information.
    </p>
    <button on:click={handleParseFromClipboard}>Parse from clipboard</button>
    <div class="parse-status" style:color={parseStatusColor}>
        {#if parseStatus}
            <p>{parseStatus}</p>
        {/if}
        {#if parseWarnings.length > 0}
            <ul>
                {#each parseWarnings.slice(0, 20) as w}
                    <li>{w}</li>
                {/each}
            </ul>
            {#if parseWarnings.length > 20}
                <p>{parseWarnings.length - 20} more warnings not shown</p>
            {/if}
        {/if}
    </div>
    {#if parsedFiles.length > 0}
        <button on:click={proceedWithFiles}>Proceed</button>
        {#if $state.files.length && !nullifyProceedWarning}
            {$state.files.length} files are already saved.
            {#if qChosenFilesNum >= 2}
                {qChosenFilesNum} of them already have a level selected.
            {/if}
            Proceeding will overwrite the old list.
        {/if}

        {#if resCounts.length === 1}
            <p>
                Among {parsedFiles.length} file(s), there is only one resolution:
                {resCounts[0].res}, that
                {resCounts[0].landscape} landscape image(s) and
                {resCounts[0].portrait} portrait image(s) have.
            </p>
        {:else if resCounts.length > 1}
            <p>
                Among {parsedFiles.length} file(s), there are {resCounts.length}
                different resolutions:
            </p>
            <ul>
                {#each resCounts as { res, total, landscape, portrait }}
                    <li>
                        ({total} occurence{total === 1 ? "" : "s"})
                        {res} — {landscape} horizontal and {portrait} vertical
                    </li>
                {/each}
            </ul>
        {/if}

        {#if resCounts.length > 0 && $state.files.length > 0}
            The list of files was saved, you can proceed to the next step
            (Levels). Please note that unless you enable Local Storage in
            settings, this data will be lost after the tab is refreshed or
            closed.
        {/if}
    {/if}
    <div style="height: 0" bind:this={bottomDiv}></div>
</main>

<style>
    main {
        max-width: 600px;
        margin: auto;
        padding: 50px;
    }

    label {
        display: block;
        cursor: pointer;
    }

    .parse-status {
        padding: 0 8px;
        --status-ok: #0f0;
        --status-err: #f00;
        --status-wrn: #ff0;
    }

    @media not (prefers-color-scheme: dark) {
        .parse-status {
            --status-ok: #006e00;
            --status-err: #b80000;
            --status-wrn: #72601b;
        }
    }
</style>
