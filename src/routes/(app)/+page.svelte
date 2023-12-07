<script lang="ts">
	let copied = $state(false);

	async function handle_copy(this: HTMLButtonElement) {
		const copiedCode = "docker run -p 3000:3000 uraniadev/snapp:latest";
		await navigator.clipboard.writeText(copiedCode);

		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
	async function handle_copy_origin(this: HTMLButtonElement) {
		const copiedCode = "docker run -p 3000:3000 -e ORIGIN=example.com -e PUBLIC_URL=example.com uraniadev/snapp:latest";
		await navigator.clipboard.writeText(copiedCode);

		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<svelte:head>
	<title>Snapp.li | Self-hostable Short Url</title>
</svelte:head>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row g-2 align-items-center">
			<div class="col">
				<div class="page-pretitle">Welcome</div>
				<h2 class="page-title mt-2 fs-1 fw-bolder">SNAPP.li</h2>
			</div>
		</div>
	</div>
</div>

<div class="page-body">
	<div class="container-xl">
		<div class="row mb-2">
			<div class="col-12">
				<p class="fs-3 my-2 lh-lg" style:max-width="80ch">
					Discover the power of Snapp, your self-hostable URL shortening service. Effortlessly
					shorten links, and with Snapp's self-hosting capability, you have complete control. Create
					concise, shareable links on your terms with Snapp's user-friendly platform.
				</p>
				<h3 class="d-flex align-center my-4 mx-2">
					<i class="ti ti-medal-2 fs-1"></i> <span class="fs-2">Our Features</span>
				</h3>
			</div>
		</div>
		<div class="row row-deck row-cards">
			<div class="col-sm-12 col-md-6 col-lg-4">
				<div class="card">
					<div class="card-body" style:min-height="10rem">
						<i class="ti ti-layers-intersect fs-1 mt-3 mb-2"></i>
						<h3>User-Friendly Interface</h3>
						<p class="pb-3">
							Snapp provides a user-friendly interface for seamless link shortening. Read how to get
							started!
						</p>
					</div>
				</div>
			</div>
			<div class="col-sm-12 col-md-6 col-lg-4">
				<div class="card">
					<div class="card-body" style:min-height="10rem">
						<i class="ti ti-user-shield fs-1 my-3"></i>
						<h3>Secure Authentication</h3>
						<p class="pb-3">
							Enjoy a secure experience with authentication sessions and hashed passwords. Your
							information is in safe hands.
						</p>
					</div>
				</div>
			</div>
			<div class="col-sm-12 col-md-6 col-lg-4">
				<div class="card">
					<div class="card-body" style:min-height="10rem">
						<i class="ti ti-topology-star-3 fs-1 my-3"></i>
						<h3>Custom Short Codes</h3>
						<p class="pb-3">
							Create personalized short codes for your links to make them memorable and easy to
							share.
						</p>
					</div>
				</div>
			</div>
			<div class="col-sm-12 col-md-6 col-lg-4">
				<div class="card">
					<div class="card-body" style:min-height="10rem">
						<i class="ti ti-alarm fs-1 my-3"></i>
						<h3>Expiration</h3>
						<p class="pb-3">
							Control the lifespan of your links with expiration dates. Set expiry dates for added
							security or let them stay active indefinitely.
						</p>
					</div>
				</div>
			</div>
			<div class="col-sm-12 col-md-6 col-lg-4">
				<div class="card">
					<div class="card-body" style:min-height="10rem">
						<i class="ti ti-key fs-1 my-3"></i>
						<h3>Secret Links</h3>
						<p class="pb-3">
							Add an extra layer of protection with secret links. Choose to share links with a
							selected audience using unique secrets.
						</p>
					</div>
				</div>
			</div>
			<div class="col-sm-12 col-md-6 col-lg-4">
				<div class="card">
					<div class="card-body" style:min-height="10rem">
						<i class="ti ti-report-analytics fs-1 my-3"></i>
						<h3>Usage Analytics</h3>
						<p class="pb-3">
							Empower yourself with detailed analytics for every link you create. Snapp gathers
							metrics anonymously, providing insights into link engagements.
						</p>
					</div>
				</div>
			</div>
		</div>
		<div class="row mt-2">
			<h3 class="d-flex align-center my-4 mx-2">
				<i class="ti ti-rocket fs-1"></i> <span class="fs-3">Getting started</span>
			</h3>
			<p class="fs-3 mb-4 lh-lg" style:max-width="80ch">
				Snapp is a self-hostable open source platform.
			</p>
		</div>
		<div class="row row-deck row-cards">
			<div class="col-md-12 col-lg-6">
				<div class="card">
					<div class="card-body p-4" style:min-height="10rem">
						<h4>Manual</h4>
						<p class="fs-3 my-2 lh-lg" style:max-width="80ch">You need to have Node.js.</p>
						<ul class="d-flex flex-column gap-2">
							<li>
								Clone the <a href="https://github.com/urania-dev/snapp/" target="_blank"
									>repository</a
								> or download the latest zip.
							</li>
							<li>
								Copy <code class="bg-secondary text-white">.example.env</code> to
								<code class="bg-secondary text-white">.env</code> and fill it properly.
							</li>
							<li>
								Install dependencies: <code class="bg-secondary text-white">
									npm install --legacy-peer-deps
								</code>.
							</li>
							<li>
								Run for development:
								<code class="bg-secondary text-white"> npx prisma db push </code>.
							</li>
							<li>
								Run for development: <code class="bg-secondary text-white">npm run dev</code>.
							</li>
							<li>
								Run for production: <code class="bg-secondary text-white">npm run build</code> then
								<code class="bg-secondary text-white">npm start</code>.
							</li>
						</ul>
					</div>
				</div>
			</div>
			<div class="col-md-12 col-lg-6">
				<div class="card">
					<div class="card-body p-4" style:min-height="10rem">
						<h4>Docker</h4>
						<p>As simple as typing this in your terminal:</p>
						<span class="btn-group container w-100 m-0 p-0">
							<pre class="m-0 w-100"><code>docker run -p 3000:3000 uraniadev/snapp:latest</code
								></pre>
							<button class="btn btn-primary" data-umami-event="Copied Docker" on:click={handle_copy}
								><i class="ti ti-{copied ? 'check' : 'copy'} fs-2" /></button
							>
						</span>
						<p>If you encounter CORS be sure to set ORIGIN and PUBLIC URL:</p>
						<span class="btn-group container w-100 m-0 p-0">
							<pre class="m-0 w-100"><code>docker run -p 3000:3000  \<br/>-e ORIGIN=example.com -e PUBLIC_URL=example.com \ <br/> uraniadev/snapp:latest</code
								></pre>
							<button class="btn btn-primary" data-umami-event="Copied Docker" on:click={handle_copy_origin}
								><i class="ti ti-{copied ? 'check' : 'copy'} fs-2" /></button
							>
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<div class="page-footer">
	<div class="container-xl">
		<div class="row pb-4 d-flex flex-wrap align-items-center gap-1 justify-content-end pe-4">
			<p class="w-auto m-0 p-0">
				<a href="https://kit.svelte.dev">kit.svelte.dev</a>
			</p>
			<span class="w-1">/</span>
			<p class="w-auto m-0 p-0">
				<a href="https://sqlite.org">sqlite.org</a>
			</p>
			<span class="w-1">/</span>
			<p class="w-auto m-0 p-0">
				<a href="https://dev.maxmind.com/geoip/geolite2-free-geolocation-data">maxmind.com</a>
			</p>
			<span class="w-1">/</span>
			<p class="w-auto m-0 p-0">
				<a href="https://tabler.io">tabler.io</a>
			</p>
			<span class="w-1">/</span>
			<p class="w-auto m-0 p-0">
				<a href="https://tabler-icons.io">tabler-icons.io</a>
			</p>
			<span class="w-1">/</span>
			<div class="w-auto m-0 p-0">
				<p class="d-flex align-items-center p-0 m-0">
					<span>made with</span>
					<i class="ti ti-heart-handshake fs-2 px-2" />
					<span>in urania</span>
				</p>
			</div>
		</div>
	</div>
</div>
