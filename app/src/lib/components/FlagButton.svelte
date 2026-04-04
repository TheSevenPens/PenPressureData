<script>
	import {
		togglePen,
		toggleModel,
		isPenFlagged,
		isModelFlagged,
	} from "$lib/flagged.svelte.js";

	let { type, inventoryid = "", brand = "", model = "" } = $props();

	let flagged = $derived(
		type === "pen"
			? isPenFlagged(inventoryid)
			: isModelFlagged(brand, model),
	);

	function toggle(e) {
		e.preventDefault();
		e.stopPropagation();
		if (type === "pen") togglePen(inventoryid);
		else toggleModel(brand, model);
	}
</script>

<button
	class="flag-btn"
	class:flagged
	onclick={toggle}
	title={flagged ? "Remove from flagged" : "Add to flagged"}
>
	&#9873;
</button>

<style>
	.flag-btn {
		background: none;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		line-height: 1;
		padding: 0.15rem 0.35rem;
		color: #999;
		transition:
			color 0.15s,
			border-color 0.15s,
			background 0.15s;
	}
	.flag-btn:hover {
		border-color: #e94560;
		color: #e94560;
	}
	.flag-btn.flagged {
		background: #e94560;
		border-color: #e94560;
		color: #fff;
	}
</style>
