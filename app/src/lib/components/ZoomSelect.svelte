<script>
	let { value = $bindable("normal") } = $props();
</script>

<select class="zoom-select" bind:value>
	<option value="normal">Normal zoom</option>
	<option value="iaf">Zoom to IAF</option>
	<option value="maxpressure">Zoom to MAX</option>
</select>

<style>
	.zoom-select {
		font-size: 0.8rem;
		color: #444;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.2rem 0.4rem;
		cursor: pointer;
	}
</style>
