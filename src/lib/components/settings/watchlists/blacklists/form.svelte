<script lang="ts">
	import { applyAction } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { page } from "$app/state";
	import * as Form from "$lib/components/ui/form";
	import { Input } from "$lib/components/ui/input";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { decode } from "html-entities";
	import { toast } from "svelte-sonner";
	import { type Infer, superForm, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";

	import { blackListSchema, type BlackListSchema } from "./schema";

	let {
		blackListForm,
		lastUpdate = $bindable()
	}: { blackListForm: SuperValidated<Infer<BlackListSchema>>; lastUpdate: string } = $props();

	const form = superForm(blackListForm, {
		id: "blacklist",
		onResult: async ({ result }) => {
			await applyAction(result);
			if (result && result?.status && result.status <= 201) await invalidateAll();
			if (page.form?.message) toast.info(i18n.t(page.form.message));
			lastUpdate = new Date().toISOString();
		},
		validationMethod: "onsubmit",
		validators: zodClient(blackListSchema)
	});

	const { enhance, form: formData } = form;

	const i18n = getTranslations();
</script>

<div class="my-4 grid gap-4">
	<form id="blacklist" method="POST" use:enhance action="?/blacklist">
		<Form.Field {form} name="entity">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label class="flex flex-wrap text-balance px-2 leading-normal"
						><span>
							{decode(i18n.t("admin.labels.add-blacklist"))}
						</span>
					</Form.Label>
					<Input icon="prohibit" placeholder="..." {...props} bind:value={$formData.entity} />
				{/snippet}
			</Form.Control>
			<Form.Description class="px-2"
				><span>{decode(i18n.t("admin.helpers.add-blacklist"))}</span></Form.Description
			>
			<Form.FieldErrors />
		</Form.Field>
	</form>
</div>
