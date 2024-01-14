<script>
    import { thumbnailSuff, getBaseName } from "$lib/constants";

    export let file;

    $: base = getBaseName(file.name);
    $: thumbSrc = `/files/workdir/${base}_${thumbnailSuff}.jpg`;
</script>

<li>
    <img alt={file.name} src={thumbSrc} loading="lazy" draggable="false" />
    <div class="image-info">
        <div class="name">{file.name}</div>
        <slot />
    </div>
</li>

<style>
    li {
        margin: 4px;
        list-style: none;
        display: flex;
        align-items: center;
        min-height: 50px;
        background-color: #222;
        border: 0.5px solid #272727;
        box-shadow: 0 1px black;
        border-radius: 5px;
        overflow: hidden;
    }

    img {
        width: 75px;
        height: 50px;
        object-fit: cover;
        user-select: none;
    }

    div.image-info {
        padding: 4px 16px;
    }

    div.name {
        font-size: 90%;
    }

    @media not (prefers-color-scheme: dark) {
        li {
            background-color: #eee;
            border: 0.5px solid #bbb;
            box-shadow: 0 1px #bbb;
        }
    }
</style>
