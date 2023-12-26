<script lang="ts">
	let copied = $state(false);
	let copied_origin = $state(false);
	let copied_node_env = $state(false);

	async function handle_copy(this: HTMLButtonElement) {
		const copiedCode = 'docker run -p 3000:3000 uraniadev/snapp:latest';
		await navigator.clipboard.writeText(copiedCode);

		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1500);
	}
	async function handle_copy_origin(this: HTMLButtonElement) {
		const copiedCode =
			'docker run -p 3000:3000 -e ORIGIN=https://example.com -e PUBLIC_URL=https://example.com uraniadev/snapp:latest';
		await navigator.clipboard.writeText(copiedCode);

		copied_origin = true;
		setTimeout(() => {
			copied_origin = false;
		}, 1500);
	}
	async function handle_copy_node_env(this: HTMLButtonElement) {
		const copiedCode =
			'docker run -p 8000:3000 -e ORIGIN=http://refurbished:8000 -e PUBLIC_URL=http://refurbished:8000 -e NODE_ENV=development uraniadev/snapp:latest';
		await navigator.clipboard.writeText(copiedCode);

		copied_node_env = true;
		setTimeout(() => {
			copied_node_env = false;
		}, 1500);
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
			<div class="col-sm-12 col-md-12 col-lg-4">
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
			<div class="col-sm-12 col-md-12 col-lg-4">
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
			<div class="col-sm-12 col-md-12 col-lg-4">
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
			<div class="col-sm-12 col-md-12 col-lg-4">
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
			<div class="col-sm-12 col-md-12 col-lg-4">
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
			<div class="col-sm-12 col-md-12 col-lg-4">
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
								</code>
							</li>
							<li>
								Run for development:
								<code class="bg-secondary text-white"> npx prisma db push </code>
							</li>
							<li>
								Run for development: <code class="bg-secondary text-white">npm run dev</code>
							</li>
							<li>
								Run for production: <code class="bg-secondary text-white">npm run build</code> then
								<code class="bg-secondary text-white">node dotenv/config build</code>
							</li>
						</ul>
						<h4 class="mt-4">REST API</h4>
						<p class="pt-2 lh-lg">
							Most requested feature, the ability to create and retrieve Snapps via REST API. <br
							/>Read more <a href="/openapi.html">here</a>.
							<span class="small">(Generated with Redoc)</span>
						</p>
					</div>
				</div>
			</div>

			<div class="col-md-12 col-lg-6">
				<div class="card">
					<div class="card-body p-4" style:min-height="10rem">
						<h4>Docker</h4>
						<p class="">As simple as typing this in your terminal</p>
						<div class="position-relative">
							<pre class="m-0 mb-2 w-100"><code>docker run -p 3000:3000 uraniadev/snapp:latest</code
								></pre>
							<button
								class="btn align-items-center position-absolute avatar avatar-sm p-2 end-0 top-0 m-2"
								data-umami-event="Copied Docker"
								on:click={handle_copy}><i class="ti ti-{copied ? 'check' : 'copy'} fs-2" /></button
							>
						</div>
						<p class="mt-3">
							If you ran into CORS, set <code>ORIGIN</code> and <code>PUBLIC_URL</code>
						</p>
						<div class="position-relative">
							<pre class="m-0 my-2 w-100"><code
									>docker run \<br />-p 3000:3000  \<br />-e ORIGIN=https://example.com \<br
									/>-e PUBLIC_URL=https://example.com \ <br />uraniadev/snapp:latest</code
								></pre>
							<button
								class="btn align-items-center position-absolute avatar avatar-sm p-2 end-0 top-0 m-2"
								data-umami-event="Copied Docker"
								on:click={handle_copy_origin}
								><i class="p-0 ti ti-{copied_origin ? 'check' : 'copy'} fs-2" /></button
							>
						</div>
					</div>
				</div>
			</div>

			<div class="col-md-12 col-lg-6">
				<div class="card">
					<div class="card-body p-4">
						<h4>CORS and non HTTPS Instances</h4>
						<p class="pt-2 lh-lg">
							Snapp uses <a href="https://lucia-auth.com/">Lucia Auth</a>, and requires to be hosted
							behind a <code>Secure HTTPS Protocol</code>.
						</p>
						<p class="pt-2 lh-lg">
							If self-hosting without a <code>Secure HTTPS Protocol</code>
							set <code>NODE_ENV=development</code> to allow Lucia handle sessions.
						</p>

						<p class="pt-2 lh-lg">
							Let's say for example that you want to host Snapp on an old salvaged homelab with
							hostname:
							<code>refurbished</code>
							on port <code>8000</code>
						</p>

						<div class="position-relative mt-4 mb-2">
							<pre class="m-0 my-2 w-100"><code
									>docker run \<br />-p 8000:3000 \<br />-e ORIGIN=http://refurbished:8000 \<br
									/>-e PUBLIC_URL=http://refurbished:8000 \<br />-e NODE_ENV=development \<br
									/>uraniadev/snapp:latest</code
								></pre>
							<button
								class="btn align-items-center position-absolute avatar avatar-sm p-2 end-0 top-0 m-2"
								data-umami-event="Copied Docker"
								on:click={handle_copy_node_env}
								><i class="p-0 ti ti-{copied_node_env ? 'check' : 'copy'} fs-2" /></button
							>
						</div>
						<p class="mt-3 text-info">
							<i class="ti ti-alert-circle text-warning" /> Be aware that this setting will disable
							<u>secure cookies</u>.
						</p>
						<h4 class="mt-4">Enable Umami Integration</h4>
						<p class="pt-2 lh-lg">
							If you want to use <a href="https://umami.is">Umami</a> Self-hosted analytics on your
							Snapps, you can set <code>UMAMI_URL</code> and the provided <code>WEBSITE_ID</code>.
						</p>
					</div>
				</div>
			</div>
			<div class="col-md-12 col-lg-6">
				<div class="card">
					<div class="card-body p-4">
						<h4>Demo</h4>
						<p class="pt-2 lh-lg">This demo is set as a multi users instance of Snapp.</p>
						<p class="my-3 text-info">
							<i class="ti ti-alert-circle text-warning" /> <u>The demo DB will be reset</u> every 24H.
						</p>
						<p>
							<a class="btn btn-primary" href="https://demo.snapp.li/auth/signup"
								>Link to the demo</a
							>
						</p>

						<h4 class="mt-4">Enable user signup</h4>
						<p class="pt-2 lh-lg">
							By default Snapp is set as a private service. It can be set as a multi users instance
							with variable <code>ENABLE_MULTIUSER</code> set to <code>true</code>.
						</p>

						<h4 class="mt-4">Disable Homepage</h4>
						<p class="pt-2 lh-lg">
							With variable <code>DISABLE_HOME</code> set to <code>true</code> Snapp will redirect
							to <code>/dashboard</code> or <code>/auth/login</code>.
						</p>
						<h4 class="mt-4">Persist DB with Docker</h4>
						<p class="pt-2 lh-lg">
							Mount docker volume at <code>/app/prisma/db.sqlite</code>.<br />
							You can generate a DB Compliant to Prisma Client with schema in repository.
						</p>
					</div>
				</div>
			</div>

			<div class="col-md-12 col-lg-6">
				<div class="card">
					<div class="card-body p-4" style:min-height="10rem">
						<h4>Admin credentials</h4>
						<p style:max-width="80ch">
							By default the app will not create any admin user, you should setup your own by signin
							up on the front-end. First user registered get marked as Admin.
						</p>
						<p style:max-width="80ch">
							You can set up variables to create admin if not already existing by the same username
							at platform launch.
						</p>

						<ul class="d-flex flex-column gap-2">
							<li>
								<code class="bg-secondary text-white">ADMIN_USERNAME=admin</code>
							</li>
							<li>
								<code class="bg-secondary text-white">ADMIN_PASSWORD=password</code>
							</li>
							<li>
								<code class="bg-secondary text-white">ADMIN_EMAIL=admin@snapp.li</code>
							</li>
						</ul>
					</div>
				</div>
			</div>
			<div class="col-md-12 col-lg-6">
				<div class="card">
					<div class="card-body p-4" style:min-height="10rem">
						<h4>SMTP Transporter</h4>
						<p style:max-width="80ch">
							You can setup email for your account, and so recover password if forgotten
						</p>
						<p style:max-width="80ch">
							Here a resend / generic smtp example of using the SMTP for password recovery. It
							checks username and email before sending.
						</p>
						<ul class="d-flex flex-column gap-2">
							<li>
								<code class="bg-secondary text-white">SMTP_HOST=smtp.resend.com</code>
							</li>
							<li><code class="bg-secondary text-white">SMTP_USER=resend</code></li>
							<li><code class="bg-secondary text-white">SMTP_PASSWORD=apiKey</code></li>
							<li><code class="bg-secondary text-white">SMTP_FROM=admin@snapp.li</code></li>
						</ul>
					</div>
				</div>
			</div>
			<div class="col-12">
				<div class="card">
					<div class="card-body">
						<p class="text-secondary m-0">
							<i class="ti ti-alert-circle pe-1" /> Disclaimer: the public instance of
							https://snapp.li and https://demo.snapp.li track anonymous analytics with
							<a href="https://umami.is">umami.is</a>. <br /> This happens only on this domain, public
							docker image and github repository of Snapp don't include any Umami trackers.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<div class="page-footer">
	<div class="container-xl">
		<div class="row d-flex flex-wrap align-items-center gap-1 justify-content-end pe-4">
			<p class="w-auto m-0 p-0">
				<a href="https://kit.svelte.dev">kit.svelte.dev</a>
			</p>
			<span class="w-1">/</span>
			<p class="w-auto m-0 p-0">
				<a href="https://prisma.io">prisma.io</a>
			</p>
			<span class="w-1">/</span>
			<p class="w-auto m-0 p-0">
				<a href="https://lucia-auth.com">lucia-auth.com</a>
			</p>
			<span class="w-1">/</span>
			<p class="w-auto m-0 p-0">
				<a href="https://sqlite.org">sqlite.org</a>
			</p>
		</div>
		<div class="row d-flex flex-wrap align-items-center gap-1 justify-content-end pe-4">
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
		</div>
		<div class="row pb-4 d-flex flex-wrap align-items-center gap-1 justify-content-end pe-4">
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
