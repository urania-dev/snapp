<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import { cn } from '$lib/utils/cn';
	import { _ } from 'svelte-i18n';
	import logo from '$lib/utils/logo.svg?raw';
	import Input from '$lib/ui/input.svelte';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types.js';
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/svelte-sonner';

	let { data,form } = $props();
	let show_password = $state(false);

	const enhanceSubmission: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
			if (form?.url) window.location.replace(form.url);
		};
	};
</script>

<svelte:head>
	<title>{$_('appname')} | {data.shortcode}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
<div class={cn('flex h-full w-full flex-col p-4 pb-8')}>
	<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-4">
		<div class="flex h-full w-full items-center justify-center gap-4">
			<Card css={{ card: 'items-center m-auto max-w-md gap-4 p-4 leading-relaxed text-balance' }}>
				<a class="contents" href="/">
					<h2 class="flex w-full items-center gap-2 text-2xl font-bold">
						<span class="h-8 w-8">
							{@html logo}
						</span>
						<span>
							{$_('appname')}
						</span>
					</h2>
				</a>
				<p class="w-full">{$_('snapps.helpers.secret')}</p>
				<p class="w-full">{$_('snapps.helpers.provide-secret')}</p>
				<form method="post" class="contents" use:enhance={enhanceSubmission}>
					<Input
						icons={{ left: 'key', right: show_password ? 'eye' : 'eye-closed' }}
						label={$_('snapps.fields.secret')}
						placeholder={$_('users.placeholders.password')}
						name="secret"
						type={show_password ? 'text' : 'password'}
						actions={{
							right: (e) => {
								e.preventDefault();
								e.stopPropagation();
								show_password = !show_password;
							}
						}}
					/>
				</form>
			</Card>
		</div>
	</div>
</div>
