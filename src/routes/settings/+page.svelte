<script>
    import state, { saveToLs } from "$lib/state";

    $: autoSelNext = $state.settings.autoSelectNext;
    function toggleAutoSelNext() {
        $state.settings.autoSelectNext = !$state.settings.autoSelectNext;
    }
</script>

<main>
    <h1>Settings</h1>
    <h2>Local Storage</h2>
    <p>
        Local Storage is the browser's persistent storage each website has
        access to. For the sake of preventing unwanted cluttering of
        <code>http://localhost:5173</code>'s local storage, I have made its
        utilisation opt-in. Without it, anything done in this program gets reset
        upon refreshing or closing the tab.
    </p>
    <p>
        Saving to Local Storage is now
        {#if $saveToLs}
            enabled.
            <button on:click={() => ($saveToLs = false)}>
                Disable and clear
            </button>
        {:else}
            disabled.
            <button on:click={() => ($saveToLs = true)}>Enable</button>
        {/if}
    </p>
    <h2>Image selection</h2>
    <p>
        When selecting a quality level, the next image is {#if !autoSelNext}not{/if}
        shown automatically.
        <button on:click={toggleAutoSelNext}>
            {autoSelNext ? "Disable" : "Enable"}
        </button>
    </p>
</main>

<style>
    main {
        max-width: 600px;
        margin: auto;
        padding: 50px;
    }
</style>
