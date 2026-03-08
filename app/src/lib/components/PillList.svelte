<script>
    /**
     * @type {{
     *   options: string[],
     *   selectedValue?: string,
     *   onchange?: () => void,
     *   showAll?: boolean,
     *   allLabel?: string
     * }}
     */
    let {
        options,
        selectedValue = $bindable(""),
        onchange,
        showAll = true,
        allLabel = "All",
    } = $props();

    function select(val) {
        selectedValue = val;
        onchange?.();
    }
</script>

<div class="pill-list">
    {#if showAll}
        <button
            class="pill"
            class:active={selectedValue === ""}
            onclick={() => select("")}
        >
            {allLabel}
        </button>
    {/if}
    {#each options as option}
        <button
            class="pill"
            class:active={selectedValue === option}
            onclick={() => select(option)}
        >
            {option}
        </button>
    {/each}
</div>

<style>
    .pill-list {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        flex-wrap: wrap;
    }

    .pill {
        padding: 0.2rem 0.7rem;
        border-radius: 999px;
        border: 1px solid #ddd;
        background: #f8f8f8;
        color: #555;
        font-size: 0.8rem;
        font-family: inherit;
        cursor: pointer;
        white-space: nowrap;
        line-height: 1.5;
        transition:
            border-color 0.1s,
            color 0.1s,
            background 0.1s;
    }

    .pill:hover {
        border-color: #4a6fa5;
        color: #4a6fa5;
    }

    .pill.active {
        background: #1a1a2e;
        border-color: #1a1a2e;
        color: #fff;
    }
</style>
