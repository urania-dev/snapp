<script lang="ts">
	import EmailIcon from 'lucide-svelte/icons/mail';
	import UserCircleIcon from 'lucide-svelte/icons/user-round';
	import EyeIcon from 'lucide-svelte/icons/eye';
	import EyeOffIcon from 'lucide-svelte/icons/eye-off';
	import KeyIcon from 'lucide-svelte/icons/key-round';
	import Logo from '$lib/logo/logo.svg?raw';
	import { applyAction, enhance } from '$app/forms';
	import { getLocale } from '$lib/i18n';
	import { H2, H3, Paragraph, Small } from '$lib/ui/typography';
	import type { SubmitFunction } from './$types.js';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	const { t } = getLocale();

	export let form, data;
	let username: string;
	let token = data.token;
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

	function handle_submit_enter(this:HTMLInputElement,e: KeyboardEvent) {
		const keyEvent = e as KeyboardEvent;
		if (keyEvent.code !== 'Enter' && keyEvent.code !== 'NumpadEnter') return;
		e.preventDefault();
		this.form?.requestSubmit()
	}

	const enhanceRecover: SubmitFunction = function () {
		return async function ({ result }) {
			await applyAction(result);
			if (result.status !== 200 && form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form.message,
						state: 'error'
					}
				});
			if (form && form?.success === true) {
				toast.custom(CustomToast, {
					componentProps: {
						message: form.message,
						state: 'surface'
					}
				});
				await invalidateAll();
			}
		};
	};
	const enhanceResetPassword: SubmitFunction = function ({ formData }) {
		if(token)formData.set('token', token);
		return async function ({ result }) {
			await applyAction(result);
			if (result.status !== 200 && form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form.message,
						state: 'error'
					}
				});
			if (form && form?.success === true) {
				toast.custom(CustomToast, {
					componentProps: {
						message: form.message,
						state: 'surface'
					}
				});
				await invalidateAll();
			}
		};
	};
</script>

<svelte:head><title>{$t('global:appname')} | {$t('auth:sign:in')}</title></svelte:head>
<div class="flex flex-col gap-4 p-4 h-full">
	<div class="card max-w-md w-full shadow-lg my-auto self-center inline-flex flex-col">
		<div class="card-body p-4 px-8 gap-4 flex flex-col">
			<div class="flex gap-2 mt-4 items-center justify-start">
				<div class="grid h-8 w-8">
					{@html Logo}
				</div>
				<H2 class="capitalize pb-0.5">
					{$t('global:appname')}
				</H2>
			</div>
			<H3>{$t('auth:recover:password')}</H3>
			{#if !token}
				<form id="sign-up" action="?/sendMail" method="post" use:enhance={enhanceRecover}>
					<label for="username" class="flex flex-col gap-1 mb-2">
						<Paragraph class="font-semibold ps-2">{$t('auth:username')}</Paragraph>
						<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<UserCircleIcon strokeWidth="1.5" class="w-5 h-5" />
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
					<button
						class="btn min-h-10 variant-filled-primary mx-auto justify-center w-full min-w-40 my-2"
						type="submit"
					>
						<EmailIcon class="w-4 h-4 me-1" />
						<span class="pb-0.5">{$t('auth:recover:send')}</span>
					</button>
				</form>
			{:else}
				<form action="?/resetPassword" method="post" use:enhance={enhanceResetPassword}>
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


					<label for="confirm_password" class="flex flex-col gap-1 my-4">
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

					
					<Small class="my-2 {form?.password ? 'text-error-600-300-token' : ''}"
						>{$t('auth:password:guidelines')}</Small
					>

					<button
					class="btn min-h-10 variant-filled-primary mx-auto justify-center w-full min-w-40 my-2 mt-4"
					type="submit"
				>
					<KeyIcon class="w-4 h-4 me-1" />
					<span class="pb-0.5">{$t('auth:recover:password')}</span>
				</button>
				</form>
			{/if}
		</div>
	</div>
</div>
