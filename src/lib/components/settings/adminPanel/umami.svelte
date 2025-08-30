<script lang="ts">
	import P from "$lib/components/typography/text/p.svelte";
	import * as Form from "$lib/components/ui/form";
	import Input from "$lib/components/ui/input/input.svelte";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { type Infer, superForm, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";

	import { umamiSchema, type UmamiSchema } from "./schema";

	const {
		umamiForm
	}: {
		umamiForm: SuperValidated<Infer<UmamiSchema>>;
	} = $props();
	const form = superForm(umamiForm, {
		invalidateAll: true,
		resetForm: false,
		validationMethod: "onsubmit",
		validators: zodClient(umamiSchema)
	});

	const { enhance: superEnhance, form: formData } = form;
	const i18n = getTranslations();
</script>

<form id="umami" class="grid" method="post" action="?/umami" use:superEnhance>
	<div class="grid gap-1">
		<P class="mb-0 mt-4 hidden font-semibold md:block">{i18n.t("homepage.features.umami.label")}</P>
	</div>
	<Form.Field {form} name="url" class="my-2">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Umami URL</Form.Label>
				<Input
					icon="computer-tower"
					placeholder={i18n.t("https://umami.is/...")}
					{...props}
					bind:value={$formData.url}
					onblur={() => {
						if ($formData.url !== null && $formData.url?.trim() !== "")
							document.forms.namedItem("umami")?.requestSubmit();
					}}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="websiteId" class="mb-2">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Umami ID</Form.Label>
				<Input
					icon="hash"
					placeholder={i18n.t("********-****-****-****-************ ")}
					{...props}
					bind:value={$formData.websiteId}
					onblur={() => {
						if ($formData.websiteId !== null && $formData.websiteId?.trim() !== "")
							document.forms.namedItem("umami")?.requestSubmit();
					}}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<P class="!mt-0 mb-2 text-sm leading-normal text-muted-foreground"
		>{@html i18n.t("homepage.features.umami.description", {
			url: "https://umami.is/"
		})}</P
	>
</form>
