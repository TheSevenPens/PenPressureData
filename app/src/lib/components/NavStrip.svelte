<script>
	/** @type {{ index: number, total: number, prevHref: string|null, prevLabel: string, nextHref: string|null, nextLabel: string }} */
	let { index, total, prevHref, prevLabel, nextHref, nextLabel } = $props();
</script>

<div class="nav-strip">
	{#if prevHref}
		<a href={prevHref} class="nav-btn">← {prevLabel}</a>
	{:else}
		<span class="nav-btn faded">← First</span>
	{/if}
	<span class="nav-counter">{index + 1} / {total}</span>
	{#if nextHref}
		<a href={nextHref} class="nav-btn">{nextLabel} →</a>
	{:else}
		<span class="nav-btn faded">Last →</span>
	{/if}
</div>

<style>
	.nav-strip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.nav-btn {
		display: inline-block;
		font-size: 0.8rem;
		padding: 0.25rem 0.6rem;
		border-radius: 4px;
		border: 1px solid #ddd;
		background: #f8f8f8;
		color: #4a6fa5;
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 280px;
	}
	.nav-btn:hover {
		background: #eef2f8;
		border-color: #b0c4de;
	}
	.nav-btn.faded {
		color: #ccc;
		pointer-events: none;
	}

	.nav-counter {
		font-size: 0.75rem;
		color: #aaa;
		white-space: nowrap;
		flex-shrink: 0;
	}
</style>
