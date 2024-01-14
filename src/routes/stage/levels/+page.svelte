<script>
    import { resFile, origSuff } from "$lib/constants";
    import state from "$lib/state";
    import createScript from "./createFfmpegCmds";
    import fetcher from "./fetcher";

    const cpOrigCmd = `rm -f ${resFile};
ls -A | while read file; do
    cp -av "./$file" "../workdir/$(echo "$file" | sed -e 's/\\.[^.]*$/_${origSuff}.jpg/')";
done`;

    $: levels = Object.entries($state.levels).sort(
        (a, b) => a[1].height - b[1].height,
    );
    let editedLevelName;
    let editedLevelInput;

    function edit(name) {
        editedLevelName = name;
        const l = $state.levels[name];
        editedLevelInput = `${l.height},${l.q}`;
    }

    function onEditDone() {
        const match = editedLevelInput.match(/(\d+) *, *(\d+)/);
        if (!match) return;
        const normalise = (n, max) => Math.min(Math.max(n, 1), max);
        const height = normalise(+match[1], 100000);
        const qValue = normalise(+match[2], 32);

        const l = $state.levels[editedLevelName];
        l.height = height;
        l.q = qValue;
        $state.levels = $state.levels;
        editedLevelName = undefined;
    }

    const hc =
        typeof window !== "undefined"
            ? window.navigator.hardwareConcurrency
            : 2;
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
                scriptRunCmd = `bash <(for T in $(seq 1 ${scriptThreads}); do echo -n "./convert.bash $T & "; done)`;
            else scriptRunCmd = "./convert.bash 1";
        });
    }

    let checkLoading = false;
    let checkSuccessful = false;
    let checkErrors = [];

    async function check() {
        checkLoading = true;
        checkSuccessful = false;
        checkErrors = [];
        try {
            const { sizes, errors } = await fetcher(
                $state.files,
                $state.levels,
            );
            checkErrors = errors;

            if (errors.length === 0) {
                checkSuccessful = true;
                $state.files.forEach((f) => {
                    f.sizes = sizes.get(f.name);
                });
                $state.files = $state.files;
            }
        } finally {
            checkLoading = false;
        }
    }
</script>

<main>
    <h1>Step 3: image quality levels</h1>
    <h2>Adjust levels</h2>
    <p>
        Besides the original quality level, are 3 customisable levels: low, mid,
        high.
    </p>
    <ul>
        {#each levels as [name, { height, q }]}
            <li>
                <button on:click={() => edit(name)}>Edit</button>
                {name}: {height}
                <span class="small">
                    px (short side), FFmpeg q flag value of
                </span>
                {q}
            </li>
        {/each}
    </ul>
    <p>
        FFmpeg's <code>-q:v &lt;num&gt;</code> flag affects the output's quality
        (i.e. compression) level. In JPEG, higher numbers mean lossier (stronger)
        compression, smaller file size and lower quality.
    </p>
    {#if editedLevelName}
        <form on:submit|preventDefault={onEditDone}>
            <input
                bind:value={editedLevelInput}
                pattern=" *\d+ *, *\d+ *"
                placeholder="height,q"
            />
            <button>Save {editedLevelName}</button>
        </form>
    {/if}

    <h2>Create compressed versions</h2>
    <p>
        First, copy the originals with suffixed filenames by running the
        following command from within <code>/static/files/orig/</code>:
    </p>
    <pre><code>{cpOrigCmd}</code></pre>
    <p>Then, cd into workdir: <code>cd ../workdir</code>.</p>
    <p>
        You can adjust the number of concurrent transcodings. Your system seems
        to be capable of handling {hc} threads at once.
    </p>
    <p>
        Generate commands for utilising
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
            <code>./convert.bash</code>, make executable with
            <code>chmod +x convert.bash</code> and then run with the following command:
        </p>
        <code>{scriptRunCmd}</code>

        <h2>Fetch file sizes</h2>
        <p>
            The next step after running the conversion script is for this
            program to fetch resulting file sizes, as well as to verify that all
            the files are really there.
            <button on:click={check} disabled={checkLoading}>Check</button>
        </p>
        {#if checkErrors.length !== 0}
            {checkErrors.length} error(s) occurred:
            <ul>
                {#each checkErrors as { fullName, error }}
                    <li>{fullName}: {error}</li>
                {/each}
            </ul>
        {/if}
        {#if checkSuccessful}
            <p>
                The sizes of all
                {$state.files.length * Object.keys($state.levels).length}
                image(s) were fetched successfully. You can proceed to level selection
                of individual images.
            </p>
        {/if}
    {/if}
</main>

<style>
    main {
        max-width: 600px;
        margin: auto;
        padding: 50px;
    }

    li:not(:first-child) {
        padding-top: 4px;
    }

    .small {
        font-style: italic;
        font-size: 90%;
        opacity: 0.6;
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
