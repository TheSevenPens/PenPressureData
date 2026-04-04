<script>
	let { value = $bindable("estimates") } = $props();
</script>

<select class="estimates-select" bind:value>
	<option value="raw">Raw data</option>
	<option value="estimates">Raw + P00 & P100 estimates</option>
	<option value="standardized">Standardized data</option>
	<option value="envelope">Envelope (min/max/median)</option>
</select>

<style>
	.estimates-select {
		font-size: 0.8rem;
		color: #444;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.2rem 0.4rem;
		cursor: pointer;
	}
</style>
