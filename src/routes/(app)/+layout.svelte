<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { navigating } from '$app/stores';

	let { data } = $props();
	let { session, disable_home } = $derived(data);

	let theme = $state<'dark' | 'light'>(data._theme as 'dark' | 'light');

	function handle_dark_mode() {
		if (theme === 'dark') {
			theme = 'light';
			document.body.classList.remove('theme-dark');
		} else {
			theme = 'dark';
			document.body.classList.add('theme-dark');
		}

		const formRef = document.forms.namedItem('save-theme');
		if (formRef) formRef.requestSubmit();
	}

	function restore_save_theme_mode() {
		if (theme === 'dark') document.body.classList.add('theme-dark');
		else document.body.classList.remove('theme-dark');
		document.forms.namedItem('save-theme')?.requestSubmit();
	}

	$effect(() => {
		if (browser && $navigating !== null && document.querySelector('.navbar-collapse.show'))
			(document.querySelector('.navbar-toggler') as HTMLButtonElement)?.click();
	});
	$effect(restore_save_theme_mode);
</script>

<svelte:head>
	<title>Snapp.li | Self-hostable Short Url</title>
</svelte:head>

<div class="page">
	<form
		hidden
		method="post"
		id="save-theme"
		action="/?/save-theme"
		use:enhance={function ({ formData }) {
			formData.set('theme', theme);
			return async ({ update }) => {
				await update();
				await invalidate('u:snappli:theme');
			};
		}}
	/>
	<!-- Sidebar -->
	<aside class="navbar navbar-vertical navbar-expand-md navbar-dark">
		<div class="container-fluid">
			<button
				class="navbar-toggler"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target="#sidebar-menu"
			>
				<span class="navbar-toggler-icon"></span>
			</button>
			<h1 class="fs-1 navbar-brand navbar-brand-autodark">
				<a class="d-flex align-center px-2 w-100 gap-1 text-decoration-none" href="/">
					<i class="ti ti-circles-relation"></i><span>Snapp</span>
				</a>
			</h1>
			<div class="collapse navbar-collapse" id="sidebar-menu">
				<ul class="navbar-nav pt-lg-3">
					{#if disable_home !== true}<li class="nav-item">
							<a class="nav-link" href="/">
								<span class="nav-link-title fs-3"> <i class="ti ti-home"></i> Home </span>
							</a>
						</li>
					{/if}
					<li class="nav-item">
						<a class="nav-link" href="https://github.com/urania-dev/snapp">
							<span class="nav-link-title fs-3">
								<i class="ti ti-brand-github"></i> Repository
							</span>
						</a>
					</li>
					<li class="nav-item">
						<a class="nav-link" href="https://github.com/urania-dev/snapp">
							<span class="nav-link-title fs-3">
								<i class="ti ti-brand-docker"></i> Docker Image
							</span>
						</a>
					</li>
					{#if session === null}
						<li class="nav-item">
							<a class="nav-link" href="/auth/login">
								<span class="nav-link-title fs-3"> <i class="ti ti-login"></i> Login </span>
							</a>
						</li>
					{:else}
						<li class="nav-item">
							<a class="nav-link" href="/dashboard">
								<span class="nav-link-title fs-3"> <i class="ti ti-dashboard"></i> Dashboard </span>
							</a>
						</li>
						<li class="nav-item">
							<a class="nav-link" href="/dashboard/metrics">
								<span class="nav-link-title fs-3"><i class="ti ti-graph"></i> Metrics </span>
							</a>
						</li>
						<li class="nav-item mt-auto">
							<a class="nav-link" href="/auth/logout" data-sveltekit-reload>
								<span class="nav-link-title mx-auto"> Logout </span>
							</a>
						</li>
					{/if}
					<li class="nav-item mb-3 ps-2" class:mt-auto={session === null}>
						<button class="btn btn-ghost-secondary" on:click|preventDefault={handle_dark_mode}>
							{#if theme === 'dark'}Light Mode{:else}Dark Mode{/if}
						</button>
					</li>
				</ul>
			</div>
		</div>
	</aside>
	<div class="page-wrapper px-3">
		<slot />
	</div>
</div>

<style>
	:global(i.ti) {
		display: inline-flex;
		align-items: center;
		line-height: inherit;
		font-size: inherit;
	}
</style>
