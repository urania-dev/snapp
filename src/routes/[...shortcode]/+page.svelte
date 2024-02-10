<script lang="ts">
	import CustomToast from './../../lib/ui/toaster/customToast.svelte';
	import { toast, Toaster } from 'svelte-sonner';
	import { enhance, applyAction } from '$app/forms';
	import type { SubmitFunction } from './$types';
	import { setLocale } from '$lib/i18n';
	import { H3, Paragraph, Small } from '$lib/ui/typography';
	import ArrowRightIcon from 'lucide-svelte/icons/arrow-right';
	import EyeIcon from 'lucide-svelte/icons/eye';
	import EyeOffIcon from 'lucide-svelte/icons/eye-off';
	import ShieldIcon from 'lucide-svelte/icons/shield-ellipsis';
	import KeyIcon from 'lucide-svelte/icons/key-square';
	import '../../app.postcss';

	export let data, form;
	const { t } = setLocale(data.localization);
	let passcode: string;
	function handle_enter_submit(e: Event) {
		const keyEvent = e as KeyboardEvent;
		if (keyEvent.code !== 'Enter' && keyEvent.code !== 'NumpadEnter') return;
		document.forms.namedItem('passcode')?.requestSubmit();
	}

	function handle_submit() {
		document.forms.namedItem('passcode')?.requestSubmit();
	}

	const enhanceCode: SubmitFunction = function ({ formData }) {
		formData.set('secret', passcode);
		return async function ({ result }) {
			await applyAction(result);
			if (result.status === 200 && form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form?.message,
						state: 'success'
					}
				});
			else if (form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form.message,
						state: 'error'
					}
				});
		};
	};

	let show_code = false;

	function toggle_show_code() {
		show_code = !show_code;
	}
</script>

<svelte:head
	><title>{$t('global:appname')} | {$t('global:pages:snapp', { id: data.shortcode })}</title
	></svelte:head
>

<Toaster />

<form id="passcode" method="post" use:enhance={enhanceCode} />
<div class="container max-w-md flex flex-col mx-auto items-center justify-center h-full p-4">
	<div class="card p-4 variant-ghost-primary">
		<div class="card-header flex flex-col gap-2 items-center">
			<ShieldIcon strokeWidth="1.5" class="w-10 h-10" />
			<H3 class="pb-0.5">{$t('snapps:protected')}</H3>
		</div>
		<div class="card-body p-4">
			<Paragraph class="font-semibold text-center">{$t('snapps:protected:helper')}</Paragraph>
			<label for="passcode" class="flex flex-col gap-1 mt-4">
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						<KeyIcon strokeWidth="1.5" class="w-5 h-5" />
					</div>
					{#if show_code === false}
						<input
							class="input rounded-none"
							id="passcode"
							on:keydown={handle_enter_submit}
							type="password"
							name="passcode"
							placeholder={$t('snapps:passcode:placeholder')}
							autocomplete="off"
							bind:value={passcode}
						/>
					{:else}
						<input
							class="input rounded-none"
							id="passcode"
							on:keydown={handle_enter_submit}
							type="text"
							name="passcode"
							placeholder={$t('snapps:passcode:placeholder')}
							bind:value={passcode}
							autocomplete="off"
						/>
					{/if}
					<button
						class="btn rounded-none aspect-square w-10 flex items-center variant-glass"
						style:justify-content="center"
						style:height="100%"
						style:padding="0"
						on:click={toggle_show_code}
					>
						{#if show_code === true}
							<EyeOffIcon class="w-4 h-4" />
						{:else}
							<EyeIcon class="w-4 h-4" />
						{/if}
					</button>
					<button
						class="btn rounded-none aspect-square w-10 flex items-center variant-glass"
						style:justify-content="center"
						style:height="100%"
						style:padding="0"
						on:click={handle_submit}
					>
						<ArrowRightIcon class="w-4 h-4" />
					</button>
				</div>
			</label>
		</div>
	</div>
</div>
