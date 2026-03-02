<script>
	import { brands } from '$lib/data.js';

	/** @type {{ selectedBrand?: string, onchange?: () => void }} */
	let { selectedBrand = $bindable(''), onchange } = $props();

	function select(brand) {
		selectedBrand = brand;
		onchange?.();
	}
</script>

<div class="brand-filter">
	<button class="pill" class:active={selectedBrand === ''} onclick={() => select('')}>
		All
	</button>
	{#each brands as brand}
		<button class="pill" class:active={selectedBrand === brand} onclick={() => select(brand)}>
			{brand}
		</button>
	{/each}
</div>

<style>
	.brand-filter {
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
		transition: border-color 0.1s, color 0.1s, background 0.1s;
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
