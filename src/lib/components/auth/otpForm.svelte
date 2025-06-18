<script lang="ts">
	import { applyAction } from '$app/forms';
	import { page } from '$app/state';
	import { otpSchema, type OTPSchema } from '$lib/components/auth/schema';
	import * as Form from '$lib/components/ui/form';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { otpForm }: { otpForm: SuperValidated<Infer<OTPSchema>> } = $props();

	const form = superForm(otpForm, {
		onResult: async ({ result }) => {
			try {
				await applyAction(result);
				if (page.form?.message)
					toast.info(i18n.t(page.form.message, { TIME: page.form?.remainingTime }));
			} catch (error) {
				console.error(error);
			}
		},
		validationMethod: 'onsubmit',
		validators: zodClient(otpSchema)
	});

	const { enhance, form: formData } = form;

	const i18n = getTranslations();
</script>

<div class="grid gap-4">
	<form id="send-otp" method="POST" use:enhance action="?/test">
		<Form.Field {form} name="otp">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{i18n.t('users.auth.otp')}</Form.Label>
					<!-- <Input
						icon="user"
						placeholder={i18n.t('users.placeholders.username')}
						{...props}
						bind:value={$formData.otp}
					/> -->
					<InputOTP.Root
						autofocus
						class="mx-auto w-max"
						maxlength={6}
						{...props}
						bind:value={$formData.otp}
						onkeyup={() => {
							if ($formData.otp?.length === 6)
								document.forms.namedItem('send-otp')?.requestSubmit();
						}}
						pattern={REGEXP_ONLY_DIGITS}
					>
						{#snippet children({ cells })}
							<InputOTP.Group>
								{#each cells as cell}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Button type="submit" class="mt-4 w-full">
			{i18n.t('globals.confirm')}
		</Form.Button>
	</form>
</div>
