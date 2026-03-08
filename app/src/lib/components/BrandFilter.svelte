<script>
	import { brands } from "$lib/data.js";
	import PillList from "./PillList.svelte";

	/** @type {{ selectedBrand?: string, onchange?: () => void }} */
	let { selectedBrand = $bindable(""), onchange } = $props();
</script>

<PillList
	options={brands}
	bind:selectedValue={selectedBrand}
	{onchange}
	allLabel="All"
/>
