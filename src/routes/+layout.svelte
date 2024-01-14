<script>
    import { page } from "$app/stores";
    import CogSvg from "./CogSvg.svelte";

    const stages = [
        { id: "setup", name: "Setup" },
        { id: "sizes", name: "Sizes" },
        { id: "levels", name: "Levels" },
        { id: "selection", name: "Selection" },
        { id: "rotations", name: "Rotations" },
        { id: "metadata", name: "Metadata" },
        { id: "saving", name: "Saving" },
    ];

    // $page.route.id is passed to this function for reactivity
    function isCurr(stageId) {
        return `/stage/${stageId}` === $page.route.id;
    }
</script>

<div class="layout-wrapper">
    <nav>
        {#each stages as { id, name }, i}
            <a href="/stage/{id}" class:active={isCurr(id, $page.route.id)}>
                {i + 1}. {name}
            </a>
        {/each}
        <a
            href="/settings"
            class="settings"
            class:active={$page.route.id === "/settings"}
            title="Settings"
        >
            <CogSvg />
        </a>
    </nav>
    <div class="layout-content">
        <slot />
    </div>
</div>

<style>
    .layout-wrapper {
        height: 100svh;
        display: flex;
        flex-direction: column;
        border: none;
    }

    nav {
        display: flex;
        overflow-x: auto;
        flex-shrink: 0;
        gap: 2px;
        padding: 2px;
    }

    nav > a {
        flex-basis: 120px;
        min-width: 120px;
        flex-grow: 1;
        height: 40px;
        line-height: 40px;
        font-weight: 300;
        border-radius: 5px;
        text-decoration: none;
        text-align: center;
        color: #6b7e86;
        background-color: #1c1c1c;
        box-shadow: 0px 1px 0px black;
        border: 0.5px solid #0006;
        transition: color 0.1s ease-out;
    }

    nav > a.active {
        color: white;
    }

    .settings {
        min-width: 40px;
        flex: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .settings :global(svg) {
        width: 20px;
        height: 20px;
    }

    .settings :global(svg path) {
        fill: #6b7e86;
        transition: 0.1s ease-out;
        transform-origin: 50% 50%;
    }

    .settings.active :global(svg path) {
        fill: white;
        rotate: 30deg;
    }

    .layout-content {
        flex: 1;
        overflow: auto;
    }

    @media not (prefers-color-scheme: dark) {
        nav > a {
            color: #839ba4;
            background-color: #f2f2f2;
            box-shadow: 0px 1px 0px #bbb;
            border: 0.5px solid #ccc;
        }

        nav > a.active {
            color: black;
        }

        .settings :global(svg path) {
            fill: #839ba4;
        }

        .settings.active :global(svg path) {
            fill: black;
        }
    }
</style>
