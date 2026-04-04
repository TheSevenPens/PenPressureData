<script>
	import { page } from "$app/stores";
	import { base } from "$app/paths";
	import { getFlaggedCount } from "$lib/flagged.svelte.js";

	let { children } = $props();

	let flaggedCount = $derived(getFlaggedCount());

	const tabs = [
		{ label: "Pen Models", href: `${base}/models` },
		{ label: "Pen Families", href: `${base}/families` },
		{ label: "Pens", href: `${base}/pens` },
		{ label: "Sessions", href: `${base}/` },
		{ label: "Flagged", href: `${base}/flagged` },
	];

	function isActive(href) {
		const path = $page.url.pathname;

		// /details/ hierarchy — segment depth determines which tab is active
		const detailsPrefix = `${base}/details/`;
		if (path.startsWith(detailsPrefix)) {
			const parts = path
				.slice(detailsPrefix.length)
				.split("/")
				.filter(Boolean);
			if (href === `${base}/models`) return parts.length === 2;
			if (href === `${base}/pens`) return parts.length === 3;
			if (href === `${base}/`) return parts.length === 4;
			return false;
		}

		// Standard listing paths
		if (href === `${base}/`)
			return path === `${base}/` || path.startsWith(`${base}/sessions`);
		if (href === `${base}/pens`)
			return path === `${base}/pens` || path.startsWith(`${base}/pens/`);
		return path.startsWith(href);
	}
</script>

<header>
	<h1>SevenPens Pen Pressure Data V0.13</h1>
</header>

<nav class="tab-bar">
	{#each tabs as tab}
		<a href={tab.href} class="tab" class:active={isActive(tab.href)}>
			{tab.label}
			{#if tab.label === "Flagged" && flaggedCount > 0}
				<span class="badge">{flaggedCount}</span>
			{/if}
		</a>
	{/each}
</nav>

<main>
	{@render children()}
</main>

<style>
	:global(*) {
		font-family: "Google Sans Flex", sans-serif;
	}

	header {
		background: #1a1a2e;
		color: #e0e0e0;
		padding: 0.75rem 1.5rem;
		border-bottom: 2px solid #e94560;
	}

	header h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.tab-bar {
		display: flex;
		gap: 0;
		background: #f5f5f5;
		border-bottom: 1px solid #ddd;
		padding: 0 1.5rem;
	}

	.tab {
		padding: 0.6rem 1.1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #666;
		text-decoration: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
	}

	.tab:hover {
		color: #333;
	}

	.tab.active {
		color: #1a1a2e;
		border-bottom-color: #e94560;
	}

	.badge {
		display: inline-block;
		background: #e94560;
		color: #fff;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.05rem 0.4rem;
		border-radius: 9px;
		margin-left: 0.25rem;
		vertical-align: top;
	}

	main {
		padding: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
	}
</style>
