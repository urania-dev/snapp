<script lang="ts">
	import P from "$lib/components/typography/text/p.svelte";
	import * as Form from "$lib/components/ui/form";
	import { Input } from "$lib/components/ui/input";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { decode } from "html-entities";
	import { type Infer, superForm, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";

	import { rateSchema, type RateSchema } from "./schema";

	const {
		limitForm
	}: {
		limitForm: SuperValidated<Infer<RateSchema>>;
	} = $props();

	const form = superForm(limitForm, {
		invalidateAll: true,
		resetForm: false,
		validationMethod: "onsubmit",
		validators: zodClient(rateSchema)
	});

	const { enhance: superEnhance, form: formData } = form;

	const i18n = getTranslations();
</script>

<div class="grid h-max w-full grid-cols-1 gap-2 md:gap-4">
	<P class="text-sm">{@html decode(i18n.t("settings.helpers.limits"))}</P>

	<form id="rates" class="contents" method="post" action="?/rates" use:superEnhance>
		<Form.Field {form} name="rpd">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{decode(i18n.t("admin.labels.rpd"))}</Form.Label>
					<Input
						icon="calendar"
						placeholder={decode(i18n.t("..."))}
						{...props}
						bind:value={$formData.rpd}
						onblur={() => {
							document.forms.namedItem("rates")?.requestSubmit();
						}}
					/>
				{/snippet}
			</Form.Control>
			<Form.Description>{decode(i18n.t("admin.helpers.rpd"))}</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="rpm">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{decode(i18n.t("admin.labels.rpm"))}</Form.Label>
					<Input
						icon="clock"
						placeholder={decode(i18n.t("..."))}
						{...props}
						bind:value={$formData.rpm}
						onblur={() => {
							document.forms.namedItem("rates")?.requestSubmit();
						}}
					/>
				{/snippet}
			</Form.Control>
			<Form.Description>{decode(i18n.t("admin.helpers.rpm"))}</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="spu">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{decode(i18n.t("admin.labels.spu"))}</Form.Label>
					<Input
						icon="link"
						placeholder={decode(i18n.t("..."))}
						{...props}
						bind:value={$formData.spu}
						onblur={() => {
							document.forms.namedItem("rates")?.requestSubmit();
						}}
					/>
				{/snippet}
			</Form.Control>
			<Form.Description>{decode(i18n.t("admin.helpers.spu"))}</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
	</form>
</div>
