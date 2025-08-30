<script lang="ts">
	import { applyAction } from "$app/forms";
	import { forgotSchema, type ForgotSchema } from "$lib/components/auth/schema";
	import * as Form from "$lib/components/ui/form";
	import { Input } from "$lib/components/ui/input";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { fade } from "svelte/transition";
	import { type Infer, superForm, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";

	import P from "../typography/text/p.svelte";

	let { forgotForm }: { forgotForm: SuperValidated<Infer<ForgotSchema>> } = $props();

	const form = superForm(forgotForm, {
		onResult: async ({ result }) => {
			try {
				await applyAction(result);
				if (result && result?.status && result.status <= 201) sent = true;
			} catch (error) {
				console.error(error);
			}
		},
		validationMethod: "onsubmit",
		validators: zodClient(forgotSchema)
	});

	const { enhance, form: formData } = form;

	const i18n = getTranslations();

	let sent = $state(false);
</script>

{#key sent}
	<div class="grid gap-4" in:fade|global>
		{#if !sent}
			<form method="POST" use:enhance action="?/forgot-password">
				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>{i18n.t("users.fields.email")}</Form.Label>
							<Input
								icon="envelope"
								placeholder={i18n.t("users.placeholders.email")}
								{...props}
								bind:value={$formData.email}
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>{i18n.t("users.auth.helpers.forgot-password")}</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button class="mt-12 w-full">{i18n.t("users.auth.recover-password")}</Form.Button>
			</form>
		{:else}
			<P>{i18n.t("users.auth.post-email-message")}</P>
		{/if}
	</div>
{/key}
