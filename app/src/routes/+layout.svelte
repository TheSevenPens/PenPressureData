<script>
	let { children } = $props();
</script>

<header>
	<h1>Pen Pressure Data</h1>
</header>

<main>
	{@render children()}
</main>

<style>
	:global(*) {
		font-family: 'Google Sans Flex', sans-serif;
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

	main {
		padding: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
	}
</style>
