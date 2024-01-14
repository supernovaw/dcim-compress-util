<script>
    import { origSuff, getBaseName } from "$lib/constants";
    import state from "$lib/state";
    import ImageItem from "./ImageItem.svelte";

    const levels = Object.keys($state.levels);

    $: stats = $state.files.reduce(
        (stats, f) => {
            if (f.note) stats.imgsWithNotes.push(f);
            if (f.discard) stats.discardImgs.push(f);
            else {
                if (f.selection === origSuff) stats.origLvlCount++;
                else if (!f.selection) stats.noLvlImgs.push(f);
                else stats.lvlCounts[f.selection]++;
            }
            return stats;
        },
        {
            imgsWithNotes: [],
            discardImgs: [],
            lvlCounts: Object.fromEntries(levels.map((l) => [l, 0])),
            origLvlCount: 0,
            noLvlImgs: [], // this doesn't include discarded images
        },
    );
    $: totalSavedImgs =
        $state.files.length - stats.discardImgs.length - stats.noLvlImgs.length;

    let showListDiscard = false;
    let showListWithNote = false;
    let showListNoSel = false;

    function toggleShowDiscarded() {
        showListDiscard = !showListDiscard;
    }

    function toggleShowWithNote() {
        showListWithNote = !showListWithNote;
    }

    function toggleShowNoSel() {
        showListNoSel = !showListNoSel;
    }

    let finalNameIncludeLvl = true;
    let scriptArea;
    let scriptGenerated = false;

    function genCopyCmds() {
        const finalFiles = $state.files.filter((f) => f.selection);
        function makeCmd(f) {
            const b = getBaseName(f.name);
            const suf = finalNameIncludeLvl ? "_" + f.selection : "";
            return `cp -av "./${b}_${f.selection}.jpg" "../result/${b}${suf}.jpg"\n`;
        }
        const cmds = finalFiles.map(makeCmd);
        const cmdsText = "#!/bin/bash\nrm -f ../result/*\n" + cmds.join("");

        scriptGenerated = true;
        requestAnimationFrame(() => (scriptArea.value = cmdsText));
    }
</script>

<main>
    <h1>Step 7: saving</h1>
    <h2>Glance through some stats:</h2>
    <p>
        This is so you can verify you didn't miss something.<br />
        Out of {$state.files.length}
        {$state.files.length === 1 ? "image" : "images"}:
    </p>
    <ul>
        <li>
            {stats.discardImgs.length}
            {stats.discardImgs.length === 1 ? "is" : "are"}
            marked as discarded
            {#if stats.discardImgs.length}
                <button on:click={toggleShowDiscarded}>
                    {showListDiscard ? "Hide" : "Show"}
                </button>
            {/if}
        </li>
        <li>
            {stats.imgsWithNotes.length}
            {stats.imgsWithNotes.length === 1 ? "has" : "have"}
            a note
            {#if stats.imgsWithNotes.length}
                <button on:click={toggleShowWithNote}>
                    {showListWithNote ? "Hide" : "Show"}
                </button>
            {/if}
        </li>
        <li>
            selections of quality (in non-discarded images):
            <ul>
                <li>
                    {stats.origLvlCount}
                    {stats.origLvlCount === 1 ? "is" : "are"}
                    selected in <b>original</b> quality
                </li>
                {#each Object.keys(stats.lvlCounts) as lvl}
                    <li>
                        {stats.lvlCounts[lvl]}
                        {stats.lvlCounts[lvl] === 1 ? "is" : "are"}
                        selected in <b>{lvl}</b> quality
                    </li>
                {/each}
                <li>
                    {stats.noLvlImgs.length}
                    {stats.noLvlImgs.length === 1 ? "is" : "are"}
                    <b>not</b> selected in any quality (effectively discarded)
                    {#if stats.noLvlImgs.length}
                        <button on:click={toggleShowNoSel}>
                            {showListNoSel ? "Hide" : "Show"}
                        </button>
                    {/if}
                </li>
            </ul>
        </li>
        <li>
            {#if totalSavedImgs === 0}
                No
            {:else if totalSavedImgs === $state.files.length}
                All {totalSavedImgs}
            {:else}
                {totalSavedImgs}/{$state.files.length}
            {/if}
            {totalSavedImgs === 1 ? "image is" : "images are"}
            ultimately going to be saved
        </li>
    </ul>

    {#if showListDiscard}
        <p>Discarded images:</p>
        <ul>
            {#each stats.discardImgs as file}
                <ImageItem {file} />
            {/each}
        </ul>
    {/if}
    {#if showListWithNote}
        <p>Images with a note:</p>
        <ul>
            {#each stats.imgsWithNotes as file}
                <ImageItem {file}>
                    {file.note}
                </ImageItem>
            {/each}
        </ul>
    {/if}
    {#if showListNoSel}
        <p>Images without a selected quality level:</p>
        <ul>
            {#each stats.noLvlImgs as file}
                <ImageItem {file} />
            {/each}
        </ul>
    {/if}

    {#if totalSavedImgs > 0}
        <h2>Copy the final images</h2>
        <p>
            The last step to getting a directory of compressed images is to copy
            the right versions into <code>/static/files/result/</code>. Please
            note that the image notes are not saved anywhere, they are just for
            internal use in this program as to-do's or reminders.
            <br />
            <label>
                <input type="checkbox" bind:checked={finalNameIncludeLvl} />
                include selected quality in final file names
            </label>
            <button on:click={genCopyCmds}>
                {scriptGenerated ? "Regenerate" : "Generate"} script
            </button>
        </p>
        {#if scriptGenerated}
            <textarea bind:this={scriptArea} readonly />
            <p>
                You may run this script (from
                <code>/static/files/workdir/</code>) by copying and pasting it
                into a terminal, or by saving it to a file first.
            </p>
            <p>
                After running it, <code>/static/files/result/</code> will be populated
                with the final collection of compressed images and nothing else.
                You can rename that directory and additionally losslessly compress
                it (or just archive it with no compression). I've had instances of
                JPEG images that were lesslessly compressed by 7-zip to less than
                half the original size. To achieve maximum (lossless) compression,
                you can use:
            </p>
            <pre><code>7z a -m0=lzma2 -mx=9 images-archive.7z result/</code
                ></pre>
        {/if}
    {/if}
</main>

<style>
    main {
        max-width: 600px;
        margin: auto;
        padding: 50px;
    }

    li {
        list-style: none;
    }

    label {
        cursor: pointer;
        user-select: none;
    }

    textarea {
        font-family: monospace;
        resize: none;
        width: 100%;
        height: 100px;
        font-size: 50%;
        margin: 16px 0;
    }
</style>
