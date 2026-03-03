<script>
	/** @type {{ brand: string, model: string, detail?: string | string[], children?: import('svelte').Snippet }} */
	let { brand, model, detail, children } = $props();

	let segments = $derived(
		detail == null ? [] : Array.isArray(detail) ? detail : [detail]
	);
</script>

<div class="breadcrumb-bar">
	<div class="title">
		<span class="brand">{brand}</span>
		<span class="sep">/</span>
		<span class="model">{model}</span>
		{#each segments as seg}
			<span class="sep">/</span>
			<span class="detail">{seg}</span>
		{/each}
	</div>
	<div class="chips">
		{@render children?.()}
	</div>
</div>

<style>
	.breadcrumb-bar {
		margin-bottom: 1.5rem;
	}

	.title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.4rem;
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}

	.brand {
		color: #333;
	}
	.sep {
		color: #aaa;
	}
	.model {
		color: #4a6fa5;
	}
	.detail {
		color: #888;
		font-family: monospace;
	}

	.chips {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* Chip styles applied to slotted children */
	.chips :global(.meta-chip) {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		background: #f0f0f0;
		border-radius: 4px;
		font-size: 0.8rem;
		font-family: monospace;
		color: #444;
	}

	.chips :global(.meta-chip.note) {
		background: #fff8e1;
		color: #7a5a00;
		font-family: inherit;
	}

	.chips :global(.sessions-chip) {
		font-family: inherit;
	}
</style>
