<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { applyAction, enhance } from '$app/forms';
	import { getLocale } from '$lib/i18n';
	import { Small, Paragraph, H3, H2 } from '$lib/ui/typography';
	import LoginIcon from 'lucide-svelte/icons/log-in';
	import EyeIcon from 'lucide-svelte/icons/eye';
	import EyeOffIcon from 'lucide-svelte/icons/eye-off';
	import KeyIcon from 'lucide-svelte/icons/key-round';
	import EmailIcon from 'lucide-svelte/icons/mail';
	import UserCircleIcon from 'lucide-svelte/icons/user-round';
	import Logo from '$lib/logo/logo.svg?raw';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';
	import { toast } from 'svelte-sonner';
	import type { SubmitFunction } from './$types';
	import { signIn } from '@auth/sveltekit/client';
	import { slugify } from '$lib/utils/slugify';

	export let form;
	let username: string;
	let email: string;
	let password: string;
	let confirmPassword: string;
	let show_password = false;
	let show_password_confirmation = false;

	function handle_show_password() {
		show_password = !show_password;
	}
	function handle_show_confirmation_password() {
		show_password_confirmation = !show_password_confirmation;
	}

	function handle_submit_enter(e: KeyboardEvent) {
		const keyEvent = e as KeyboardEvent;
		if (keyEvent.code !== 'Enter' && keyEvent.code !== 'NumpadEnter') return;
		e.preventDefault();
		document.forms.namedItem('sign-up')?.requestSubmit();
	}

	const { t } = getLocale();

	function handle_slugify(this: HTMLInputElement) {
		this.value = slugify(this.value).replace('-', '_');
	}

	const signUpFunction: SubmitFunction = function () {
		return async function ({ result }) {
			await applyAction(result);
			if (result.status !== 200 && form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form?.message,
						state: 'error'
					}
				});
			if (form?.success === true) {
				await signIn('credentials', { password, username, redirect: false, callbackUrl: '/' });
				await invalidateAll();
			}
		};
	};
</script>

<svelte:head><title>{$t('global:appname')} | {$t('auth:sign:up')}</title></svelte:head>

<div class="flex flex-col gap-4 p-4 h-full">
	<form
		id="sign-up"
		method="post"
		use:enhance={signUpFunction}
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

			<H3>{$t('auth:sign:up:welcome')}</H3>

			<label for="username" class="flex flex-col gap-1">
				<Paragraph class="font-semibold ps-2">{$t('auth:username')}</Paragraph>
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						<UserCircleIcon strokeWidth="1.5" class="w-5 h-5" />
					</div>
					<input
						class="input rounded-none"
						class:input-error={form?.username}
						on:keydown={handle_submit_enter}
						on:input={handle_slugify}
						id="username"
						type="text"
						name="username"
						placeholder={$t('auth:username:placeholder')}
						bind:value={username}
					/>
				</div>
			</label>

			<label for="email" class="flex flex-col gap-1">
				<Paragraph class="font-semibold ps-2">{$t('auth:email')}</Paragraph>
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						<EmailIcon strokeWidth="1.5" class="w-5 h-5" />
					</div>
					<input
						class="input rounded-none"
						class:input-error={form?.email}
						id="email"
						type="text"
						on:keydown={handle_submit_enter}
						name="email"
						placeholder={$t('auth:email:placeholder')}
						bind:value={email}
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
							class="w-10 h-10"
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

			<Small class="mt-[-.5rem] {form?.password ? 'text-error-600-300-token' : ''}"
				>{$t('auth:password:guidelines')}</Small
			>

			<label for="confirm_password" class="flex flex-col gap-1">
				<Paragraph class="font-semibold ps-2">{$t('auth:password:confirm')}</Paragraph>
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						<KeyIcon strokeWidth="1.5" class="w-5 h-5" />
					</div>
					{#if show_password_confirmation}
						<input
							class="input rounded-none"
							class:input-error={form?.confirmPassword}
							id="confirm_password"
							type="text"
							name="confirm_password"
							on:keydown={handle_submit_enter}
							placeholder={$t('auth:password:confirm:placeholder')}
							bind:value={confirmPassword}
						/>
					{:else}
						<input
							class="input rounded-none"
							class:input-error={form?.confirmPassword}
							id="confirm_password"
							type="password"
							name="confirm_password"
							on:keydown={handle_submit_enter}
							placeholder={$t('auth:password:confirm:placeholder')}
							bind:value={confirmPassword}
						/>
					{/if}
					<div class="w-10 h-10 flex" style:padding="0">
						<button
							tabindex="-1"
							class="w-10 h-10"
							style:justify-content="center"
							style:padding="0"
							on:click|preventDefault={handle_show_confirmation_password}
						>
							{#if show_password_confirmation}
								<EyeIcon strokeWidth="1.5" class="w-5 h-5" />
							{:else}
								<EyeOffIcon strokeWidth="1.5" class="w-5 h-5" />
							{/if}
						</button>
					</div>
				</div>
			</label>
			<button
				class="btn variant-filled-primary min-h-10 mx-auto justify-center w-full min-w-40 my-2"
				type="submit"
			>
				<LoginIcon class="w-4 h-4 me-1" />
				<span class="pb-0.5">{$t('auth:sign:up')}</span>
			</button>
		</div>
		<div class="card-footer py-3">
			<Paragraph class="max-w-sm text-left  mx-auto">
				{@html $t('global:pages:privacy', { url: '/privacy-policy' })}
			</Paragraph>
		</div>
	</form>
	<Paragraph class="text-center mb-auto mt-2">
		{@html $t('auth:redirect:sign:in', { url: '/auth/sign-in' })}
	</Paragraph>
</div>
