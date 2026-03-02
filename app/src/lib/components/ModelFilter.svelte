<script>
	import { allSessions } from '$lib/data.js';

	/**
	 * @type {{
	 *   selectedBrand?: string,
	 *   selectedModel?: string,
	 *   onchange?: () => void
	 * }}
	 */
	let { selectedBrand = '', selectedModel = $bindable(''), onchange } = $props();

	// All unique model names that match the current brand filter, sorted alphabetically.
	let availableModels = $derived((() => {
		const seen = new Set();
		for (const s of allSessions) {
			if (!selectedBrand || s.brand === selectedBrand) {
				seen.add(s.pen);
			}
		}
		return [...seen].sort();
	})());

	function select(model) {
		selectedModel = model;
		onchange?.();
	}
</script>

{#if availableModels.length > 0}
	<div class="model-filter">
		<button class="pill" class:active={selectedModel === ''} onclick={() => select('')}>
			All
		</button>
		{#each availableModels as model}
			<button class="pill" class:active={selectedModel === model} onclick={() => select(model)}>
				{model}
			</button>
		{/each}
	</div>
{/if}

<style>
	.model-filter {
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
