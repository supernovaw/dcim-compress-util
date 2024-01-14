<script>
    import { origSuff, thumbnailSuff, getBaseName } from "$lib/constants";
    import state from "$lib/state";

    function levelName(file, level) {
        if (!file) return "";
        const b = getBaseName(file.name);
        return `${b}_${level}.jpg`;
    }
    const displayLevels = [origSuff, "high", "mid", "low"];
    $: haveData = !!$state?.files?.[0]?.sizes;
    $: selFile = haveData && $state.files[$state.selectionImgIdx];
    $: autoSelNext = $state.settings.autoSelectNext;

    let mX = 0,
        mY = 0;

    function imgMouseMove(e) {
        mX = e.offsetX;
        mY = e.offsetY;
    }

    function selectFile(idx) {
        $state.selectionImgIdx = idx;
    }

    function formatInfo(selFile, level) {
        const bytes = selFile.sizes[level];
        let sizeStr;
        if (bytes > 1048576) sizeStr = (bytes / 1048576).toFixed(2) + " MiB";
        else if (bytes > 1024) sizeStr = (bytes / 1024).toFixed(2) + " KiB";
        else sizeStr = bytes + " bytes";

        if (level === origSuff) return "original — " + sizeStr;

        const ref = selFile.sizes[origSuff];
        const refPercent = ((100 * bytes) / ref).toFixed(1) + "% of original";
        const refFactor = (ref / bytes).toFixed(1) + "x less";
        return `${level} — ${sizeStr} (${refPercent}, ${refFactor})`;
    }

    function selectLevel(level) {
        if (selFile.discard) return;
        selFile.selection = level;
        $state.files = $state.files;
        if (autoSelNext) next();
    }

    function toggleDiscard() {
        const newVal = (selFile.discard = !selFile.discard);
        if (newVal) selFile.selection = undefined;
        $state.files = $state.files;
    }

    function rotate() {
        selFile.rotation = ((selFile.rotation ?? 0) + 90) % 360;
        if (selFile.rotation === 0) delete selFile.rotation;
        $state.files = $state.files;
    }

    function prev() {
        if ($state.selectionImgIdx > 0) $state.selectionImgIdx--;
    }

    function next() {
        if ($state.selectionImgIdx < $state.files.length - 1)
            $state.selectionImgIdx++;
    }
</script>

{#if haveData}
    <main>
        <aside>
            <div class="list">
                {#each $state.files as file, i}
                    <button
                        on:click={() => selectFile(i)}
                        class:current={$state.selectionImgIdx === i}
                        class:has-selection={!!file.selection}
                        class:discard-marked={file.discard}
                    >
                        <img
                            src="/files/workdir/{levelName(
                                file,
                                thumbnailSuff,
                            )}"
                            alt={file.name}
                            title={file.name}
                            draggable="false"
                            loading="lazy"
                            style:rotate="{file.rotation ?? 0}deg"
                        />
                    </button>
                {/each}
            </div>
            <div class="status">
                <div class="name">{selFile.name}</div>
                <div>
                    Selected: {selFile.selection ?? "-"}
                    {#if selFile.selection}
                        <button on:click={() => selectLevel(undefined)}>
                            Clear
                        </button>
                    {/if}
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Image note"
                        bind:value={selFile.note}
                        title="Use this to leave notes or reminders regarding this image"
                    />
                </div>
                <div>
                    {#if !selFile.discard}
                        <button on:click={toggleDiscard}>
                            Mark as discarded
                        </button>
                    {:else}
                        This image is marked as discarded
                        <button on:click={toggleDiscard}>Unmark</button>
                    {/if}
                </div>
                <div>
                    <button on:click={rotate}>Rotate</button>
                    {#if selFile.rotation}
                        {selFile.rotation}° CW
                    {/if}
                </div>
                <div>
                    <button on:click={prev}>Previous</button>
                    <button on:click={next}>Next</button>
                </div>
            </div>
        </aside>
        <div class="side-by-side-grid">
            {#each displayLevels as level, i}
                <button
                    class="side-by-side-level"
                    class:selected={selFile.selection === level}
                    class:discard-marked={selFile.discard}
                    style:grid-area="a{i}"
                    on:click={() => selectLevel(level)}
                >
                    <div class="level-info">{formatInfo(selFile, level)}</div>
                    <div
                        class="img-wrapper"
                        style="--m-x: {mX}px; --m-y: {mY}px"
                    >
                        <img
                            on:mousemove={imgMouseMove}
                            src="/files/workdir/{levelName(selFile, level)}"
                            alt="{level} quality"
                            draggable="false"
                        />
                        <img
                            class="magnifying-glass"
                            src="/files/workdir/{levelName(selFile, level)}"
                            alt="{level} quality"
                            draggable="false"
                        />
                    </div>
                </button>
            {/each}
        </div>
    </main>
{:else}
    <main class="no-dataset-warning">
        <h1>No image set</h1>
        <p>
            In order to proceed to this stage, first complete stages 1, 2 and 3
        </p>
    </main>
{/if}

<style>
    main {
        display: flex;
        height: 100%;
    }

    main.no-dataset-warning {
        display: block;
        max-width: 600px;
        margin: auto;
        padding: 50px;
    }

    aside {
        flex: 250px 0 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .list {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 2px;
        overflow: hidden auto;
        padding-bottom: 6px;
    }

    .list button {
        box-sizing: border-box;
        padding: 3px;
        aspect-ratio: 1;
        box-shadow: none;
        background-color: #222;
        transition:
            background-color 0.1s ease-out,
            opacity 0.1s ease-out,
            scale 0.1s ease-out;
    }

    .list button:hover img {
        opacity: 0.6;
    }

    .list button:active img {
        opacity: 0.3;
    }

    .list button.current {
        scale: 1.2;
    }

    .list button.has-selection {
        background-color: #74ca5e;
    }

    .list button.discard-marked {
        opacity: 0.3;
        background-color: transparent;
    }

    .list img {
        border-radius: 2px;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        user-select: none;
        transition: opacity 0.1s ease-out;
    }

    .list::-webkit-scrollbar {
        width: 4px;
    }

    .list::-webkit-scrollbar-thumb {
        background-color: #777;
        border-radius: 2px;
        border: 1px solid transparent;
        background-clip: padding-box;
    }

    .status {
        background-color: #222;
        margin: 4px;
        padding: 4px;
        border-radius: 3px;
        box-shadow: 0 1px 2px black;
    }

    .status > div:not(:first-child) {
        padding-top: 16px;
    }

    .status .name {
        font-size: 70%;
        word-break: break-all;
    }

    .status input {
        width: 100%;
        box-sizing: border-box;
    }

    .side-by-side-grid {
        flex: 1;
        display: grid;
        padding: 3px;
        grid-template-areas: "a0 a1" "a2 a3";
        grid-template-columns: 50% 50%;
        grid-template-rows: 50% 50%;
    }

    .side-by-side-level {
        margin: 2px;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: #1c1c1c;
        border-radius: 6px;
        cursor: default;
    }

    .side-by-side-level.selected {
        background-color: #333;
    }

    .side-by-side-level.discard-marked img {
        opacity: 0.3;
    }

    .side-by-side-level.discard-marked .magnifying-glass {
        display: none;
    }

    .level-info {
        text-align: center;
        padding-bottom: 2px;
        user-select: none;
        cursor: default;
    }

    .img-wrapper {
        flex: 1;
        width: 100%;
        position: relative;
        overflow: hidden;
    }

    .img-wrapper img {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        user-select: none;
        transition: opacity 0.2s ease-out;
    }

    img.magnifying-glass {
        opacity: 0;
        transition: opacity 0.2s ease-out;
        transform-origin: var(--m-x) var(--m-y);
        transform: scale(2);
        clip-path: circle(10% at var(--m-x) var(--m-y));
        pointer-events: none;
    }

    .side-by-side-grid:hover img.magnifying-glass {
        opacity: 1;
    }

    @media not (prefers-color-scheme: dark) {
        .list button {
            background-color: #bbb;
        }

        .status {
            background-color: #f2f2f2;
            box-shadow: 0 1px 2px #999;
        }

        .side-by-side-level {
            background-color: #bbb;
        }

        .side-by-side-level.selected {
            background-color: #888;
        }
    }
</style>
