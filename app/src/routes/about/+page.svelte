<script>
	// About page — static content
</script>

<div class="about-page">
	<h2>About this project</h2>

	<p>
		<strong>SevenPens Pen Pressure Data</strong> is a web application for visualizing
		and comparing pen pressure response data for EMR (Electromagnetic Resonance)
		styluses across multiple brands and models.
	</p>

	<p>
		It answers the question: <em>how does physical force on a pen tip translate
		into logical pressure values reported to the computer?</em> Every stylus has
		its own pressure response curve, and it varies significantly between brands,
		pen models, and even individual pen units. Artists and reviewers need this
		data to understand how pens actually behave. No standardized, publicly
		available dataset existed before this project.
	</p>

	<h3>Features</h3>
	<ul>
		<li>Browse pens by brand, pen family, model, and individual unit</li>
		<li>Interactive pressure response charts with zoom modes and envelope views</li>
		<li>Flag pens and models for ad-hoc comparison</li>
		<li>Create named comparison groups on the Compare tab</li>
		<li>Track data quality: flagged outliers, non-monotonic sessions, pens needing re-measurement</li>
	</ul>

	<h3>Links</h3>
	<ul class="link-list">
		<li>
			<strong>Live site:</strong>
			<a href="https://thesevenpens.github.io/PenPressureData" target="_blank" rel="noreferrer">
				thesevenpens.github.io/PenPressureData
			</a>
		</li>
		<li>
			<strong>This app's source code:</strong>
			<a href="https://github.com/TheSevenPens/PenPressureData" target="_blank" rel="noreferrer">
				github.com/TheSevenPens/PenPressureData
			</a>
		</li>
		<li>
			<strong>Underlying dataset (DrawTabData):</strong>
			<a href="https://github.com/TheSevenPens/DrawTabData" target="_blank" rel="noreferrer">
				github.com/TheSevenPens/DrawTabData
			</a>
		</li>
		<li>
			<strong>DrawTabData online explorer:</strong>
			<a href="https://thesevenpens.github.io/DrawTabDataExplorer/" target="_blank" rel="noreferrer">
				thesevenpens.github.io/DrawTabDataExplorer
			</a>
			— browse the unified data set for drawing tablets and pens.
		</li>
	</ul>

	<h3>How it works</h3>
	<p>
		Pressure measurements are collected by gradually increasing force on the
		pen tip and recording the corresponding logical pressure values reported by
		the tablet. Each measurement session is identified by a physical pen unit
		(inventory ID) and a date. Multiple sessions per pen let us track
		consistency and drift over time.
	</p>

	<p>
		The app loads data at build time from the
		<a href="https://github.com/TheSevenPens/DrawTabData" target="_blank" rel="noreferrer">DrawTabData</a>
		repository (included as a git submodule) and computes 17 standardized
		percentile marks (P00, P01, P05…P99, P100) for each session, including
		extrapolated estimates for Initial Activation Force (P00) and maximum
		pressure (P100).
	</p>

	<h3>Credits</h3>
	<p>
		Data collection and curation by <strong>TheSevenPens</strong>. Built with
		<a href="https://kit.svelte.dev" target="_blank" rel="noreferrer">SvelteKit</a>
		and <a href="https://www.chartjs.org" target="_blank" rel="noreferrer">Chart.js</a>.
	</p>
</div>

<style>
	.about-page {
		max-width: 760px;
		line-height: 1.55;
		color: #333;
	}

	h2 {
		font-size: 1.3rem;
		color: #1a1a2e;
		margin: 0 0 1rem 0;
	}

	h3 {
		font-size: 1rem;
		color: #1a1a2e;
		margin: 1.75rem 0 0.6rem 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	p {
		margin: 0 0 0.9rem 0;
	}

	ul {
		margin: 0 0 1rem 0;
		padding-left: 1.5rem;
	}

	ul li {
		margin-bottom: 0.3rem;
	}

	.link-list {
		list-style: none;
		padding-left: 0;
	}

	.link-list li {
		margin-bottom: 0.5rem;
	}

	a {
		color: #4a6fa5;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
