<script lang="ts">
	import type { User } from "@prisma/client";

	import * as Form from "$lib/components/ui/form";
	import Input from "$lib/components/ui/input/input.svelte";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { type Infer, superForm, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";

	import { profileSchema, type ProfileSchema } from "../schema";

	const {
		profileForm,
		user
	}: {
		profileForm: SuperValidated<Infer<ProfileSchema>>;
		user: User;
	} = $props();
	const form = superForm(profileForm, {
		invalidateAll: true,
		resetForm: false,
		validationMethod: "onsubmit",
		validators: zodClient(profileSchema)
	});

	const { enhance: superEnhance, form: formData } = form;
	const i18n = getTranslations();
</script>

<form id="profile" class="contents" method="post" action="?/profile" use:superEnhance>
	<Form.Field {form} name="username">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{i18n.t("users.fields.username")}</Form.Label>
				<Input
					icon="user"
					placeholder={i18n.t("users.placeholders.username")}
					{...props}
					bind:value={$formData.username}
					oninput={(e) => {
						$formData.username = e.currentTarget.value
							.toLowerCase()
							.replace(/\s+/g, "-")
							.replace(/[^a-z0-9_-]/g, "")
							.replace(/-+/g, "-");
					}}
					onblur={() => {
						if ($formData.username !== user.username)
							document.forms.namedItem("profile")?.requestSubmit();
					}}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{i18n.t("users.fields.email")}</Form.Label>
				<Input
					icon="envelope"
					placeholder={i18n.t("users.placeholders.email")}
					{...props}
					bind:value={$formData.email}
					onblur={() => {
						if ($formData.email !== user.email)
							document.forms.namedItem("profile")?.requestSubmit();
					}}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
</form>
