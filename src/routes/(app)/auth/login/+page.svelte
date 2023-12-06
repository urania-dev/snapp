<script lang="ts">
	import { enhance } from '$app/forms';

	const { form } = $props();

	let show_password = $state(false);
	let password = $state<string>();

	function handle_show_password() {
		show_password = !show_password;
	}
</script>

<svelte:head>
	<title>Login | Snapp.li</title>
</svelte:head>
<div class="my-auto page-center">
	<div class="container container-tight py-4">
		<div class="card card-md">
			<div class="card-body">
				<h2 class="h2 text-center mb-4">Login to your account</h2>
				<form id="login" method="post" use:enhance autocomplete="off">
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
									on:keydown={(e) => {
										if (e.key !== 'Enter') return;
										e.preventDefault()
										document.forms.namedItem('login')?.requestSubmit();
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
									placeholder="Your password"
									autocomplete="off"
									on:keydown={(e) => {
										if (e.key !== 'Enter') return;
										e.preventDefault()
										document.forms.namedItem('login')?.requestSubmit();
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
					<div class="form-footer">
						<button type="submit" class="btn btn-primary w-100">Sign in</button>
					</div>
					{#if form && form.password === false && form.username === false}
						<div class="text-center text-secondary mt-3 text-red">Wrong credentials, please check your info, and try again.</div>
					{/if}
					
				</form>
			</div>
		</div>
		<div class="text-center text-secondary mt-3">
			If you don't have an account, you can <a href="./signup" tabindex="-1">signup</a> here.
		</div>
	</div>
</div>
