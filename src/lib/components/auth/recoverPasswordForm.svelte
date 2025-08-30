<script lang="ts">
	import { applyAction } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { type RecoverPasswordSchema, recoverSchema } from "$lib/components/auth/schema";
	import * as Form from "$lib/components/ui/form";
	import { Input } from "$lib/components/ui/input";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { fade } from "svelte/transition";
	import { type Infer, superForm, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";

	import { Button } from "../ui/button";

	let {
		recoverForm,
		token = $bindable()
	}: { recoverForm: SuperValidated<Infer<RecoverPasswordSchema>>; token: string } = $props();

	const form = superForm(recoverForm, {
		onResult: async ({ result }) => {
			try {
				await applyAction(result);
				await invalidateAll();
			} catch (error) {
				console.error(error);
			}
		},
		validationMethod: "onsubmit",
		validators: zodClient(recoverSchema)
	});

	const { enhance, form: formData } = form;

	const i18n = getTranslations();

	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
</script>

<div class="grid gap-4" in:fade|global>
	<form method="POST" use:enhance action="?/forgot-password">
		<input type="text" hidden bind:value={token} name="token" id="token" />
		<Form.Field {form} name="password">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{i18n.t("users.fields.password")}</Form.Label>
					<div class="flex h-10 items-center gap-2">
						<Input
							icon="key"
							placeholder={i18n.t("users.placeholders.password")}
							{...props}
							class="w-full max-w-full"
							type={showPassword ? "text" : "password"}
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
					<Form.Label>{i18n.t("users.fields.confirm-password")}</Form.Label>
					<div class="flex h-10 items-center gap-2">
						<Input
							icon="key"
							placeholder={i18n.t("users.placeholders.password")}
							{...props}
							class="w-full max-w-full"
							type={showConfirmPassword ? "text" : "password"}
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
							><i class="ph text-[20px] ph-{showConfirmPassword ? 'eye' : 'eye-closed'}"
							></i></Button
						>
					</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
			<Form.Description class="text-balance">{i18n.t("users.helpers.password")}</Form.Description>
		</Form.Field>

		<Form.Button class="mt-12 w-full">{i18n.t("users.auth.recover-password")}</Form.Button>
	</form>
</div>
