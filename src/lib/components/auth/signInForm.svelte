<script lang="ts">
	import { applyAction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { signInSchema, type SignInSchema } from '$lib/components/auth/schema';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { toast } from 'svelte-sonner';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { Button } from '../ui/button';

	let {
		emailDisabled=false,
		providers,
		signInForm,
	}: { emailDisabled?:boolean,providers: { identity: string }[]; signInForm: SuperValidated<Infer<SignInSchema>> } =
		$props();

	const form = superForm(signInForm, {
		onResult: async ({ result }) => {
			try {
				await applyAction(result);
				if (result && result?.status && result.status <= 201) await invalidateAll();
				if (page.form?.message) toast.info(i18n.t(page.form.message));
			} catch (error) {
				console.error(error);
			}
		},
		validationMethod: 'onsubmit',
		validators: zodClient(signInSchema)
	});

	const { enhance, form: formData } = form;

	const i18n = getTranslations();

	let showPassword = $state(false);
</script>

<div class="grid gap-4">
	{#if !emailDisabled}
	<form method="POST" use:enhance action="?/signin">
		<Form.Field {form} name="username">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{i18n.t('users.fields.username')}</Form.Label>
					<Input
						icon="user"
						placeholder={i18n.t('users.placeholders.username')}
						{...props}
						bind:value={$formData.username}
						oninput={(e) => {
							$formData.username = e.currentTarget.value
								.toLowerCase()
								.replace(/\s+/g, '-')
								.replace(/[^a-z0-9_-]/g, '')
								.replace(/-+/g, '-');
						}}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="password">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{i18n.t('users.fields.password')}</Form.Label>
					<div class="flex h-10 items-center gap-2">
						<Input
							icon="key"
							placeholder={i18n.t('users.placeholders.password')}
							{...props}
							type={showPassword ? 'text' : 'password'}
							bind:value={$formData.password}
						/>
						<Button
							variant="outline"
							tabindex={-1}
							class="h-10 w-10"
							onclick={(e) => {
								e.preventDefault();
								showPassword = !showPassword;
							}}><i class="ph text-[20px] ph-{showPassword ? 'eye' : 'eye-closed'}"></i></Button
						>
					</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Button variant="ghost" href="/auth/forgot-password" class="h-8"
			>{i18n.t('users.auth.forgot-password')}</Button
		>
		<Form.Button class="mt-12 w-full">{i18n.t('users.auth.sign-in')}</Form.Button>
	</form>
	{/if}
	{#each providers as provider}
		<Button
			class="justify-center"
			data-sveltekit-preload-data="off"
			href="/auth/{provider.identity}"
		>
			<span class="text-sm capitalize">{provider.identity}</span>
		</Button>
	{/each}
</div>
