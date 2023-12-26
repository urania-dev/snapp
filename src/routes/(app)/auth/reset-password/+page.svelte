<script lang="ts">
	import { enhance } from '$app/forms';

	const { form, data } = $props();

	let show_password = $state(false);
	let show_master_password = $state(false);
	let show_confirm_password = $state(false);
	let password = $state<string>();

	let username = $derived(data.session.user.username);
	let confirmPassword = $state<string>();

	function handle_show_password() {
		show_password = !show_password;
	}
	function handle_show_master_password() {
		show_master_password = !show_master_password;
	}
	function handle_show_confirmation_password() {
		show_confirm_password = !show_confirm_password;
	}
</script>

<svelte:head>
	<title>Login | Snapp.li</title>
</svelte:head>
<div class="my-auto page-center">
	<div class="container container-tight py-4">
		<div class="card card-md">
			<div class="card-body">
				<h2 class="h2 text-center mb-4">Recover your account</h2>
				<form id="recoverpassword" method="post" use:enhance autocomplete="off">
					<div class="mb-3">
						<label class="form-label" for="username">Username</label>
						<div class="input-group input-group-flat">
							<span class="input-group-text p-2" class:border-red={form?.username}>
								<div class="link-secondary d-flex align-center">
									<i class="ti ti-user fs-3"></i>
								</div>
							</span>
							<input
								id="username"
								type="username"
								name="username"
								class="form-control"
								placeholder="Your username"
								autocomplete="off"
								class:is-invalid={form?.username}
								value={username}
								disabled
							/>
						</div>
						{#if form?.username}
							<div class="small text-red mt-2">{form.message}</div>
						{/if}
					</div>

					<div class="mb-2">
						<label class="form-label" for="password"> Password </label>
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
						<label class="form-label" for="password"> Confirm Password </label>
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
						<button type="submit" class="btn btn-primary w-100">Sign in</button>
					</div>

					{#if form?.message}
						<div class="text-center text-secondary mt-3 text-red">{form.message}</div>
					{/if}
				</form>
			</div>
		</div>
		<div class="text-center text-secondary mt-3">
			You can go back to <a href="./login" tabindex="-1">login</a> here.
		</div>
	</div>
</div>
