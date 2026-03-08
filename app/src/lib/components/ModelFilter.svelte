<script>
	import { allSessions } from "$lib/data.js";
	import PillList from "./PillList.svelte";

	/**
	 * @type {{
	 *   selectedBrand?: string,
	 *   selectedModel?: string,
	 *   onchange?: () => void
	 * }}
	 */
	let {
		selectedBrand = "",
		selectedModel = $bindable(""),
		onchange,
	} = $props();

	// All unique model names that match the current brand filter, sorted alphabetically.
	let availableModels = $derived(
		(() => {
			const seen = new Set();
			for (const s of allSessions) {
				if (!selectedBrand || s.brand === selectedBrand) {
					seen.add(s.pen);
				}
			}
			return [...seen].sort();
		})(),
	);
</script>

{#if availableModels.length > 0}
	<PillList
		options={availableModels}
		bind:selectedValue={selectedModel}
		{onchange}
		allLabel="All"
	/>
{/if}
