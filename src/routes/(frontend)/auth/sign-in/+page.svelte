<script lang="ts">
	import CustomToast from '$lib/ui/toaster/customToast.svelte';
	import HelpCircleIcon from 'lucide-svelte/icons/help-circle';
	import { applyAction, enhance } from '$app/forms';
	import { getLocale } from '$lib/i18n';
	import { Small, Paragraph, H3, H2 } from '$lib/ui/typography';
	import LoginIcon from 'lucide-svelte/icons/log-in';
	import EmailIcon from 'lucide-svelte/icons/mail';
	import KeyIcon from 'lucide-svelte/icons/key-round';
	import UserCircleIcon from 'lucide-svelte/icons/user-round';
	import Logo from '$lib/logo/logo.svg?raw';
	import type { SubmitFunction } from './$types';
	import { toast } from 'svelte-sonner';
	import { signIn } from '@auth/sveltekit/client';
	import { goto, invalidateAll } from '$app/navigation';
	import EyeIcon from 'lucide-svelte/icons/eye';
	import EyeOffIcon from 'lucide-svelte/icons/eye-off';
	let show_password = false;

	export let form, data;
	let username: string;
	let password: string;

	const signInFunction: SubmitFunction = function ({ cancel }) {
		const is_email = username.includes('@');

		if (is_email && /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(username) === false) {
			toast.custom(CustomToast, {
				componentProps: {
					message: 'auth:email:mixed'
				}
			});

			return cancel();
		}

		return async function ({ result }) {
			await applyAction(result);
			if (result.status !== 200 && form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form.message,
						state: 'error'
					}
				});
			if (form && form?.succes === true) {
				await signIn('credentials', {
					password,
					username: form?.username as string,
					redirect: false,
					callbackUrl: '/'
				});
				await invalidateAll();
				goto('/');
			}
		};
	};

	function handle_show_password() {
		show_password = !show_password;
	}
	function handle_submit_enter(e: KeyboardEvent) {
		const keyEvent = e as KeyboardEvent;
		if (keyEvent.code !== 'Enter' && keyEvent.code !== 'NumpadEnter') return;
		e.preventDefault();
		document.forms.namedItem('sign-up')?.requestSubmit();
	}

	const { t } = getLocale();
</script>

<svelte:head><title>{$t('global:appname')} | {$t('auth:sign:in')}</title></svelte:head>

<div class="flex flex-col gap-4 p-4 h-full">
	<form
		id="sign-up"
		method="post"
		use:enhance={signInFunction}
		class="card max-w-md w-full shadow-lg mt-auto self-center inline-flex flex-col"
	>
		<div class="card-body p-4 px-8 gap-4 flex flex-col">
			<div class="flex gap-2 mt-4 items-center justify-start">
				<div class="grid h-8 w-8">
					{@html Logo}
				</div>
				<H2 class="capitalize pb-0.5">
					{$t('global:appname')}
				</H2>
			</div>
			<H3>{$t('auth:sign:in:welcome')}</H3>

			<label for="username" class="flex flex-col gap-1 mb-2">
				<Paragraph class="font-semibold ps-2">{$t('auth:username')} | {$t('auth:email')}</Paragraph>
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						{#if username?.includes('@')}
							<EmailIcon strokeWidth="1.5" class="w-5 h-5" />
						{:else}
							<UserCircleIcon strokeWidth="1.5" class="w-5 h-5" />
						{/if}
					</div>
					<input
						class="input rounded-none"
						class:input-error={form?.username === true}
						id="username"
						type="text"
						name="username"
						on:keydown={handle_submit_enter}
						placeholder={$t('auth:username:placeholder')}
						bind:value={username}
					/>
				</div>
			</label>

			<label for="password" class="flex flex-col gap-1">
				<Paragraph class="font-semibold ps-2">{$t('auth:password')}</Paragraph>
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						<KeyIcon strokeWidth="1.5" class="w-5 h-5" />
					</div>
					{#if show_password === false}
						<input
							class="input rounded-none"
							class:input-error={form?.password}
							id="password"
							type="password"
							name="password"
							on:keydown={handle_submit_enter}
							placeholder={$t('auth:password:placeholder')}
							bind:value={password}
						/>
					{:else}
						<input
							class="input rounded-none"
							class:input-error={form?.password}
							id="password"
							type="text"
							name="password"
							on:keydown={handle_submit_enter}
							placeholder={$t('auth:password:placeholder')}
							bind:value={password}
						/>
					{/if}
					<div class="w-10 h-10 flex" style:padding="0">
						<button
							tabindex="-1"
							class="w-10"
							style:justify-content="center"
							style:padding="0"
							on:click|preventDefault={handle_show_password}
						>
							{#if show_password}
								<EyeIcon strokeWidth="1.5" class="w-5 h-5" />
							{:else}
								<EyeOffIcon strokeWidth="1.5" class="w-5 h-5" />
							{/if}
						</button>
					</div>
				</div>
			</label>
			{#if data.active_smtp}
				<a href="/auth/recover-password" class="mb-2" tabindex="-1">
					<Small class="font-semibold flex items-center">
						<HelpCircleIcon class="w-4 h-4 me-1" />
						<span class="pb-0.5">
							{$t('auth:password:forgotten')}
						</span>
					</Small>
				</a>
			{/if}

			<button
				class="btn min-h-10 variant-filled-primary mx-auto justify-center w-full min-w-40 my-2"
				type="submit"
			>
				<LoginIcon class="w-4 h-4 me-1" />
				<span class="pb-0.5">{$t('auth:sign:login')}</span>
			</button>
		</div>
		<div class="card-footer pt-4 pb-3">
			<Paragraph class="max-w-sm text-left mx-auto ">
				{@html $t('global:pages:privacy', { url: '/privacy-policy' })}
			</Paragraph>
		</div>
	</form>
	<Paragraph class="mb-auto text-center max-w-sm mx-auto mt-2">
		{@html $t('auth:redirect:sign:up', { url: '/auth/sign-up' })}
	</Paragraph>
</div>
