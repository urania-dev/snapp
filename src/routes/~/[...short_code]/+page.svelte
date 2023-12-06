<script>
	import { enhance } from '$app/forms';
</script>

<svelte:head>
	<title>Snapp.li | Self-hostable Short Url</title>
</svelte:head>

<div class="page page-center">
	<div class="container container-tight py-4">
		<div class="text-center mb-4">
			<a href="/" class="navbar-brand navbar-brand-autodark fs-1">
				<i class="ti ti-circles-relation pe-2"></i><span>Snapp</span>
			</a>
		</div>
		<form class="card card-md" method="post" autocomplete="off" novalidate use:enhance>
			<div class="card-body text-center">
				<div class="d-flex flex-column gap-2">
					<i class="ti ti-shield-lock mx-auto" style:font-size="5rem"></i>
					<h2 class="card-title">Protected Short url</h2>
					<p class="text-secondary">Please enter secret passphrase to unlock</p>
				</div>

				<div class="mb-3">
					<input
						type="password"
						name="secret"
						class="form-control text-center"
						placeholder="Password…"
					/>
				</div>
				<div>
					<button class="btn btn-primary w-100">
						<i class="ti ti-unlock" />
						Unlock
					</button>
				</div>
			</div>
		</form>
	</div>
</div>
