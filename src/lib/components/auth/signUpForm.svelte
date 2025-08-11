<script lang="ts">
	import { applyAction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { decode } from 'html-entities';
	import { toast } from 'svelte-sonner';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { Button } from '../ui/button';
	import { signUpSchema, type SignUpSchema } from './schema';

	let { signUpForm }: { signUpForm: SuperValidated<Infer<SignUpSchema>> } = $props();

	const form = superForm(signUpForm, {
		onResult: async ({ result }) => {
			await applyAction(result);
			if (result && result?.status && result.status <= 201) await invalidateAll();
			if (page.form.message) toast.info(decode(i18n.t(page.form.message)));
		},
		validators: zodClient(signUpSchema)
	});

	const { enhance, form: formData } = form;

	const i18n = getTranslations();

	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
</script>

<form method="POST" use:enhance action="?/signup">
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
	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{i18n.t('users.fields.email')}</Form.Label>
				<Input
					icon="envelope"
					placeholder={i18n.t('users.placeholders.email')}
					{...props}
					bind:value={$formData.email}
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
						class="w-full max-w-full"
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
	<Form.Field {form} name="confirm_password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{i18n.t('users.fields.confirm-password')}</Form.Label>
				<div class="flex h-10 items-center gap-2">
					<Input
						icon="key"
						placeholder={i18n.t('users.placeholders.password')}
						{...props}
						class="w-full max-w-full"
						type={showConfirmPassword ? 'text' : 'password'}
						bind:value={$formData.confirm_password}
					/>
					<Button
						tabindex={-1}
						variant="outline"
						class="h-10 w-10"
						onclick={(e) => {
							e.preventDefault();
							showConfirmPassword = !showConfirmPassword;
						}}
						><i class="ph text-[20px] ph-{showConfirmPassword ? 'eye' : 'eye-closed'}"></i></Button
					>
				</div>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
		<Form.Description class="text-balance">{i18n.t('users.helpers.password')}</Form.Description>
	</Form.Field>
	<Form.Button class="mt-4 w-full">{i18n.t('users.auth.sign-up')}</Form.Button>
</form>
