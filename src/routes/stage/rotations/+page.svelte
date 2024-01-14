<script>
    import state from "$lib/state";
    import createScript from "./createFfmpegCmds";

    $: rotImgs = $state.files.filter((f) => f.rotation);
    $: rotNum = rotImgs.length;

    const w = typeof window !== "undefined";
    const hc = (w && window.navigator.hardwareConcurrency) || 2;
    let threads = hc;
    let scriptArea;
    let scriptGenerated = false;
    let scriptThreads;
    let scriptRunCmd;

    function genCmds() {
        scriptGenerated = true;
        requestAnimationFrame(() => {
            scriptArea.value = createScript(
                $state.files,
                $state.levels,
                (scriptThreads = threads),
            );
            if (scriptThreads !== 1)
                scriptRunCmd = `bash <(for T in $(seq 1 ${scriptThreads}); do echo -n "./rotate.bash $T & "; done)`;
            else scriptRunCmd = "./rotate.bash 1";
        });
    }
</script>

<main>
    <h1>Step 5: rotations</h1>
    {#if rotNum === 0}
        <p>
            You have not marked any images as needing to be rotated, so you can
            proceed to the next step.
        </p>
    {:else}
        <p>
            You have marked {rotNum === 1 ? "1 image" : rotNum + " images"} as needing
            to be rotated:
        </p>
        <ul>
            {#each rotImgs as file}
                <li>{file.name} by {file.rotation}° clockwise</li>
            {/each}
        </ul>
        <p>
            The next step is to re-compress those images while also rotating
            them. Same as in step 3, you can adjust the number of threads.
        </p>
        <p>
            Generate commands to do this utilising
            <input
                style="width: 3em; text-align: end"
                type="number"
                min="1"
                max="1024"
                bind:value={threads}
            />
            threads: <button on:click={genCmds}>Click to generate</button>
        </p>
        {#if scriptGenerated}
            <textarea bind:this={scriptArea} readonly />
            <p>
                Copy and paste (^A, ^C, ^V) this script into
                <code>./rotate.bash</code>, make executable with
                <code>chmod +x rotate.bash</code> and then run with the following
                command:
            </p>
            <code>{scriptRunCmd}</code>
            <p>from within <code>/static/files/workdir/</code>.</p>
            <p>If the images got rotated, you're almost done. Proceed to step 6.</p>
        {/if}
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
