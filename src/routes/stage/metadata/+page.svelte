<script>
    import state from "$lib/state";
    import createScriptExif from "./createExiftoolCmds";
    import createScriptTimestamps from "./createTimestampCmds";

    const w = typeof window !== "undefined";
    const hc = (w && window.navigator.hardwareConcurrency) || 2;
    let threads = hc;

    let exifScriptArea;
    let exifScriptGenerated = false;
    let scriptThreads;
    let exifScriptRunCmd;

    function genExifCmds() {
        exifScriptGenerated = true;
        requestAnimationFrame(() => {
            exifScriptArea.value = createScriptExif(
                $state.files,
                (scriptThreads = threads),
            );
            if (scriptThreads !== 1)
                exifScriptRunCmd = `bash <(for T in $(seq 1 ${scriptThreads}); do echo -n "./metadata.bash $T & "; done)`;
            else exifScriptRunCmd = "./metadata.bash 1";
        });
    }

    let tsScriptArea;
    let tsScriptGenerated;

    function genTsCmds() {
        tsScriptGenerated = true;
        requestAnimationFrame(() => {
            tsScriptArea.value = createScriptTimestamps($state.files);
        });
    }
</script>

<main>
    <h1>Step 6: metadata</h1>
    <p>
        Though this step is unnecessary, you might be interested in preserving
        the metadata of your images.
    </p>
    <h2>EXIF metadata</h2>
    <p>
        EXIF metadata is contained inside the JPEG file. Generate metadata
        migration commands using
        <input
            style="width: 3em; text-align: end"
            type="number"
            min="1"
            max="1024"
            bind:value={threads}
        />
        threads: <button on:click={genExifCmds}>Click to generate</button>
    </p>
    {#if exifScriptGenerated}
        <textarea bind:this={exifScriptArea} readonly />
        <p>
            Copy and paste (^A, ^C, ^V) this script into
            <code>./metadata.bash</code>, make executable with
            <code>chmod +x metadata.bash</code> and then run with the following command:
        </p>
        <code>{exifScriptRunCmd}</code>
        <p>from within <code>/static/files/workdir/</code>.</p>
    {/if}
    <h2>File timestamps</h2>
    <p>
        File modification timestamps are part of the metadata that the file
        systems store about files and not stored inside the files. You might
        want to migrate these too.
        <button on:click={genTsCmds}>Generate script</button>
    </p>
    {#if tsScriptGenerated}
        <textarea bind:this={tsScriptArea} readonly />
        <p>
            You may run this script (from <code>/static/files/workdir/</code>)
            by copying and pasting it into a terminal, or by saving it to a file
            first.
        </p>
    {/if}
</main>

<style>
    main {
        max-width: 600px;
        margin: auto;
        padding: 50px;
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
