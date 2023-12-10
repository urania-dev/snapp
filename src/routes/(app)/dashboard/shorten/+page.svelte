<script lang="ts">
	import { enhance } from '$app/forms';
	import { slugify } from '$lib/utils/slugify.js';
	import type LitePicker from 'litepicker';
	import type { SubmitFunction } from './$types.js';

	let { form } = $props();

	let secret = $state<string>();
	let show_secret = $state(false);
	let has_expiration = $state(false);
	let has_secret = $state(false);
	let expirationField = $state<HTMLElement>();
	let original_url = $state<string>();
	let short_code = $state<string>();
	let valid_original_url = $state<boolean | null>(null);
	let picker: LitePicker;

	async function setPicker() {
		if (!expirationField) return;
		const LitePicker = (await import('litepicker')).default;

		picker = new LitePicker({
			element: expirationField,
			minDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
		});
	}

	function mount_picker() {
		setPicker();
	}

	function handle_show_secret() {
		show_secret = !show_secret;
	}

	function handle_url_verification() {
		const regex = new RegExp(/^https:\/\/[^\s/$.?#].[^\s]*$/);
		if (original_url) valid_original_url = regex.test(original_url);
	}

	const handle_submit_function: SubmitFunction = function ({ formData }) {
		formData.set('short-code', slugify(short_code) ?? '');
		return async function ({ update }) {
			await update();
		};
	};

	function handle_submit() {
		document.forms.namedItem('new-url')?.requestSubmit();
	}

	function slugify_this(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		e.currentTarget.value = slugify(e.currentTarget.value);
	}

	$effect(mount_picker);
</script>

<svelte:head>
	<title>Shorten an URL | Snapp.li</title>
</svelte:head>
<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row g-2 align-items-center flex-column flex-md-row">
			<div class="col">
				<h2 class="page-pretitle">Shorten an url</h2>
				<h2 class="page-title mt-2 fs-1 fw-bolder">Create a snapp</h2>
			</div>
			<div class="col-auto me-auto ms-md-auto">
				<div class="btn-list mt-2">
					<span class="d-sm-inline">
						<a href="/dashboard" class="btn btn-tertiary btn-md d-flex gap-2 h-100">
							<i class="ti ti-door"></i>
							<span>Go back <span class="d-none d-lg-inline">to dashboard</span></span></a
						>
					</span>
					<span class="d-sm-inline">
						<button
							class="btn btn-primary btn-md d-flex gap-2"
							on:click={handle_submit}
							disabled={valid_original_url === false}
						>
							<i class="ti ti-device-floppy fs-3"></i> <span>Save</span>
						</button>
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
<div class="page-body">
	<div class="container-xl">
		<form id="new-url" method="post" autocomplete="off" use:enhance={handle_submit_function}>
			<div class="row row-cards">
				<div class="col-lg-8 col-md-12">
					<div class="card">
						<div class="card-header">
							<h3 class="card-title">Provide Snapp information</h3>
						</div>
						<div class="card-body">
							<div class="mb-3 row">
								<label class="col-form-label required" for="original-url">Original URL</label>
								<div class="col">
									<input
										type="text"
										class="form-control"
										placeholder="Enter original url"
										name="original-url"
										class:is-valid={valid_original_url === true}
										class:is-invalid={valid_original_url === false}
										aria-invalid={valid_original_url === false}
										id="original-url"
										bind:value={original_url}
										on:input={handle_url_verification}
										required
									/>
									<small class="form-hint">This must be a valid HTTPS link.</small>
								</div>
							</div>
							<div class="mb-3 row">
								<label class="col-form-label" for="short-code">Custom short slug</label>
								<div class="col">
									<input
										type="text"
										class="form-control"
										placeholder="Enter custom shortcode"
										name="short-code"
										id="short-code"
										on:input={slugify_this}
										bind:value={short_code}
									/>
									<small class="form-hint">A random string will be generated if left empty.</small>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="col-lg-4 col-md-12">
					<div class="card">
						<div class="card-header">
							<h3 class="card-title">Advanced settings</h3>
						</div>
						<div class="card-body">
							<div>
								<label class="row">
									<div class="col">
										<i class="ti ti-alarm"></i><span class="ps-2">Expiration</span>
									</div>
									<span class="col-auto">
										<label class="form-check form-check-single form-switch">
											<input
												class="form-check-input"
												type="checkbox"
												bind:checked={has_expiration}
											/>
										</label>
									</span>
								</label>
							</div>
							{#if has_expiration}
								<div class="input-icon mt-3">
									<input
										bind:this={expirationField}
										type="text"
										name="expiration"
										id="expiration"
										class="form-control"
										placeholder="Select an expiration date"
										data-input
										required
									/>
									<span class="input-icon-addon">
										<i class="ti ti-calendar-event"></i>
									</span>
								</div>
							{/if}
							<small class="form-hint pt-1">Set an expiration date to autodelete url.</small>
							<div class="mt-4">
								<label class="row">
									<div class="col">
										<i class="ti ti-key"></i><span class="ps-2">Protected</span>
									</div>
									<span class="col-auto">
										<label class="form-check form-check-single form-switch">
											<input class="form-check-input" type="checkbox" bind:checked={has_secret} />
										</label>
									</span>
								</label>
							</div>
							{#if has_secret}
								<div class="input-icon mt-3">
									<div class="input-group input-group-flat">
										{#if show_secret === false}
											<input
												type="password"
												name="secret"
												id="secret"
												class="form-control"
												class:is-invalid={form?.secret}
												placeholder="Insert a secret passphrase"
												on:keydown={(e) => {
													if (e.key !== 'Enter') return;
													e.preventDefault();
												}}
												autocomplete="off"
												bind:value={secret}
											/>
										{:else}
											<input
												type="text"
												name="secret"
												id="secret"
												class="form-control"
												class:is-invalid={form?.secret}
												placeholder="Insert a secret passphrase"
												autocomplete="off"
												on:keydown={(e) => {
													if (e.key !== 'Enter') return;
													e.preventDefault();
												}}
												bind:value={secret}
											/>
										{/if}
										<span class="input-group-text p-0" class:border-red={form?.secret}>
											<button
												class="d-flex p-0 px-2 btn align-center border-0 link-secondary d-flex align-center"
												data-bs-toggle="tooltip"
												aria-label="Show password"
												data-bs-original-title="Show password"
												on:click|preventDefault={handle_show_secret}
											>
												<i class="ti ti-eye fs-2"></i>
											</button>
										</span>
									</div>
									{#if form?.secret}
										<div class="small text-red mt-2">{form.message}</div>
									{/if}
								</div>
							{/if}
							<small class="form-hint pt-1">Protect your url with a secret passhprase.</small>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>
