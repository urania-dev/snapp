<script>
	import { page } from '$app/stores';
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
		<div class="card card-md">
			<div class="card-body">
				<div class="d-flex flex-column gap-2">
					<i class="ti text-center ti-error- mx-auto" style:font-size="5rem"></i>
					<h2 class="text-center card-title">{$page.error?.message}</h2>
					<p class="text-secondary mx-auto">
						Oh no! This should never happen.<br />
						Are you sure everything is ok?
					</p>
					<a class="btn btn-primary m-autor" href="/">Discover snapp.li</a>
				</div>
			</div>
		</div>
	</div>
</div>
