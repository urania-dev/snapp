<script lang="ts">
	import { enhance } from '$app/forms';

	const { form } = $props();
</script>

<svelte:head>
	<title>Login | Snapp.li</title>
</svelte:head>
<div class="my-auto page-center">
	<div class="container container-tight py-4">
		{#if !form?.success}
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
									required
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
									required
									name="email"
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
		{:else}
			<div class="card card-md">
				<div class="card-body">
					<h3>Password recovering</h3>
					<p>An email has been sent to your account</p>
				</div>
			</div>
		{/if}
	</div>
</div>
