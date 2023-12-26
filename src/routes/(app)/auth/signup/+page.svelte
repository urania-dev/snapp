<script lang="ts">
	import { enhance } from '$app/forms';

	const { form } = $props();

	let show_password = $state(false);
	let password = $state<string>();
	let show_confirmation_password = $state(false);
	let confirmPassword = $state<string>();

	function handle_show_confirmation_password() {
		show_confirmation_password = !show_confirmation_password;
	}
	function handle_show_password() {
		show_password = !show_password;
	}
</script>

<svelte:head>
	<title>Sign up | Snapp.li</title>
</svelte:head>
<div class="my-auto page-center">
	<div class="container container-tight py-4">
		<div class="card card-md">
			<div class="card-body">
				<h2 class="h2 text-center mb-4">Create a new account</h2>
				<form method="post" id="signup" use:enhance autocomplete="off">
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
							/>
						</div>
						{#if form?.username}
							<div class="small text-red mt-2">{form.message}</div>
						{/if}
					</div>
					<div class="mb-3">
						<label class="form-label" for="username">Email</label>
						<div class="input-group input-group-flat">
							<span class="input-group-text p-2" class:border-red={form?.email}>
								<div class="link-secondary d-flex align-center">
									<i class="ti ti-mail fs-3"></i>
								</div>
							</span>
							<input
								id="email"
								type="email"
								name="email"
								required
								class="form-control"
								placeholder="Your email"
								autocomplete="off"
								class:is-invalid={form?.email}
							/>
						</div>
						{#if form?.email}
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
									placeholder="Your password"
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
									placeholder="Your password"
									autocomplete="off"
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
						<label class="form-label" for="confirmPassword"> Confirm Password </label>
						<div class="input-group input-group-flat">
							<span class="input-group-text p-2" class:border-red={form?.confirmPassword}>
								<div class="link-secondary d-flex align-center">
									<i class="ti ti-key fs-3"></i>
								</div>
							</span>
							{#if show_confirmation_password === false}
								<input
									type="password"
									name="confirm-password"
									id="confirm-password"
									class="form-control"
									class:is-invalid={form?.confirmPassword}
									placeholder="Repeat the password"
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
									placeholder="Repeat the password"
									autocomplete="off"
									bind:value={confirmPassword}
									on:keydown={(e) => {
										if (e.key !== 'Enter') return;
										e.preventDefault();
										document.forms.namedItem('signup')?.requestSubmit();
									}}
								/>
							{/if}
							<span class="input-group-text p-0" class:border-red={form?.confirmPassword}>
								<button
									class="d-flex p-2 btn align-center border-0 link-secondary d-flex align-center"
									data-bs-toggle="tooltip"
									aria-label="Show password confirmation "
									data-bs-original-title="Show password confirmation "
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
						<button type="submit" class="btn btn-primary w-100">Create new account</button>
					</div>
					{#if form?.message}
						<div class="text-center text-secondary mt-3 text-red">{form.message}</div>
					{/if}
				</form>
			</div>
		</div>
		<div class="text-center text-secondary mt-3">
			If you already have an account, you can <a href="./login" tabindex="-1">login</a> here.
		</div>
	</div>
</div>
