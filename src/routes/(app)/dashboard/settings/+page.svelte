<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import type { Toast } from 'bootstrap';

	import type { SubmitFunction } from './$types.js';
	import { invalidate, invalidateAll } from '$app/navigation';

	const { data, form } = $props();

	let toastRef = $state<HTMLElement>();
	let toast = $state<Toast>();

	async function initializeToast() {
		if (!toastRef) return;
		const Toaster = (await import('bootstrap/js/dist/toast.js')).default;
		toast = new Toaster(toastRef);
	}

	let show_password = $state(false);
	let set_mail = $derived(data.user?.email);
	let email = $state<string | undefined>(set_mail ?? undefined);
	let show_confirm_password = $state(false);
	let password = $state<string>();
	let confirmPassword = $state<string>();
	function handle_show_password() {
		show_password = !show_password;
	}

	function handle_show_confirmation_password() {
		show_confirm_password = !show_confirm_password;
	}

	const enhanceEmail: SubmitFunction = async function ({ formData, cancel }) {
		const set_email = formData.get('email');
		console.log(set_email);
		if (set_email === data.user?.email) return cancel();
		return async function ({ result }) {
			await applyAction(result);
			await invalidate('snapp:settings');
		};
	};

	function mountPage() {
		initializeToast();
	}
	$effect(mountPage);

	$effect(() => {
		if (form?.message) {
			toast?.show();
		}
	});
</script>

<svelte:head>
	<title>Login | Snapp.li</title>
</svelte:head>

<div
	class="toast position-absolute z-3 bottom-0 end-0 m-0 mb-3"
	data-bs-animation={true}
	role="alert"
	bind:this={toastRef}
	aria-live="assertive"
	aria-atomic="true"
	data-bs-autohide="true"
	data-bs-toggle="toast"
	data-bs-delay="3000"
>
	<div class="toast-header">
		<span
			class="avatar avatar-xs me-2"
			class:bg-primary={form?.success}
			class:bg-red={!form?.success}
			><i
				class="ti fs-3 text-white"
				class:ti-alert-triangle={!form?.success}
				class:ti-check={form?.success}
			></i></span
		>
		<strong class="me-auto">
			{#if form?.emailForm || form?.passwordForm}
				Error
			{:else}
				{'Setting updated!'}
			{/if}
		</strong>
		<button type="button" class="ms-2 btn-close" data-bs-dismiss="toast" aria-label="Close" />
	</div>
	<div class="toast-body">{form?.message}</div>
</div>

<div class="my-auto page-center">
	<div class="container container-tight py-4">
		<div class="row row-deck row-cards">
			<div class="card card-md">
				<div class="card-body">
					<h2 class="h2 mb-4">User profile</h2>
					<form id="newMail" method="post" action="?/newMail" use:enhance={enhanceEmail}>
						<div class="input-group input-group-flat">
							<span class="input-group-text p-2" class:border-red={form?.email}>
								<div class="link-secondary d-flex align-center">
									<i class="ti ti-mail fs-3"></i>
								</div>
							</span>
							<input
								type="email"
								name="email"
								id="email"
								required={true}
								class="form-control"
								class:is-invalid={form?.email}
								placeholder="Your account email"
								on:keydown={(e) => {
									if (e.key !== 'Enter') return;
									e.preventDefault();
									document.forms.namedItem('newMail')?.requestSubmit();
								}}
								autocomplete="off"
								bind:value={email}
							/>
						</div>
						<div class="form-footer">
							<button type="submit" class="btn btn-primary w-100">Change Email</button>
						</div>

						{#if form?.emailForm && form?.message}
							<div class="small text-center text-secondary mt-3 text-red">{form.message}</div>
						{/if}
					</form>
				</div>
			</div>
			<div class="card card-md">
				<div class="card-body">
					<h2 class="h2 mb-4">Change your password</h2>
					<form
						id="recover-password"
						method="post"
						action="?/newPassword"
						use:enhance
						autocomplete="off"
					>
						<div class="mb-2">
							<label class="form-label" for="password"> New Password </label>
							<div class="input-group input-group-flat">
								<span class="input-group-text p-2" class:border-red={form?.password}>
									<div class="link-secondary d-flex align-center">
										<i class="ti ti-key fs-3"></i>
									</div>
								</span>
								{#if show_password === false}
									<input
										type="password"
										name="password"
										id="password"
										class="form-control"
										class:is-invalid={form?.password}
										placeholder="Set a new password"
										on:keydown={(e) => {
											if (e.key !== 'Enter') return;
											e.preventDefault();
											document.forms.namedItem('recoverpassword')?.requestSubmit();
										}}
										autocomplete="off"
										bind:value={password}
									/>
								{:else}
									<input
										type="text"
										name="password"
										id="password"
										class="form-control"
										class:is-invalid={form?.password}
										placeholder="Set a new password"
										autocomplete="off"
										on:keydown={(e) => {
											if (e.key !== 'Enter') return;
											e.preventDefault();
											document.forms.namedItem('recoverpassword')?.requestSubmit();
										}}
										bind:value={password}
									/>
								{/if}
								<span class="input-group-text p-0" class:border-red={form?.password}>
									<button
										class="d-flex p-2 btn align-center border-0 link-secondary d-flex align-center"
										data-bs-toggle="tooltip"
										aria-label="Show password"
										data-bs-original-title="Show password"
										on:click|preventDefault={handle_show_password}
									>
										<i class="ti ti-eye fs-2"></i>
									</button>
								</span>
							</div>
							{#if form?.password}
								<div class="small text-red mt-2">{form.message}</div>
							{/if}
						</div>
						<div class="mb-2">
							<label class="form-label" for="password"> Confirm New Password </label>
							<div class="input-group input-group-flat">
								<span class="input-group-text p-2" class:border-red={form?.confirmPassword}>
									<div class="link-secondary d-flex align-center">
										<i class="ti ti-key fs-3"></i>
									</div>
								</span>
								{#if show_confirm_password === false}
									<input
										type="password"
										name="confirm-password"
										id="confirm-password"
										class="form-control"
										class:is-invalid={form?.confirmPassword}
										placeholder="Confirm your new password"
										on:keydown={(e) => {
											if (e.key !== 'Enter') return;
											e.preventDefault();
											document.forms.namedItem('recoverpassword')?.requestSubmit();
										}}
										autocomplete="off"
										bind:value={confirmPassword}
									/>
								{:else}
									<input
										type="text"
										name="confirm-password"
										id="confirm-password"
										class="form-control"
										class:is-invalid={form?.confirmPassword}
										placeholder="Confirm your new password"
										autocomplete="off"
										on:keydown={(e) => {
											if (e.key !== 'Enter') return;
											e.preventDefault();
											document.forms.namedItem('recoverpassword')?.requestSubmit();
										}}
										bind:value={confirmPassword}
									/>
								{/if}
								<span class="input-group-text p-0" class:border-red={form?.confirmPassword}>
									<button
										class="d-flex p-2 btn align-center border-0 link-secondary d-flex align-center"
										data-bs-toggle="tooltip"
										aria-label="Show password"
										data-bs-original-title="Show password"
										on:click|preventDefault={handle_show_confirmation_password}
									>
										<i class="ti ti-eye fs-2"></i>
									</button>
								</span>
							</div>
							{#if form?.confirmPassword}
								<div class="small text-red mt-2">{form.message}</div>
							{/if}
						</div>
						<div class="form-footer">
							<button type="submit" class="btn btn-primary w-100">Change password</button>
						</div>

						{#if form?.passwordForm && form?.message}
							<div class="text-center text-secondary mt-3 text-red">{form.message}</div>
						{/if}
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
