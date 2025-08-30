<script lang="ts">
	import type { Infer, SuperForm } from "sveltekit-superforms/client";

	import * as Form from "$lib/components/ui/form";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { decode } from "html-entities";
	import { fly } from "svelte/transition";

	import type { SnappSchema } from "./schema";

	import { Input } from "../ui/input";
	import { Label } from "../ui/label";
	import { Switch } from "../ui/switch";

	let {
		form,
		formData = $bindable(),
		hasSecret = $bindable()
	}: {
		form: SuperForm<Infer<SnappSchema>>;
		formData: Infer<SnappSchema>;
		hasSecret: boolean;
	} = $props();
	const i18n = getTranslations();
</script>

<div class="grid gap-2">
	<div class="mt-2 flex items-start justify-between">
		<div class="flex flex-col gap-2 px-2">
			<Label for="secret">{decode(i18n.t("snapps.fields.has-secret"))}</Label>
			<Label for="secret">
				<p class="max-w-[90%] text-balance text-sm leading-relaxed text-muted-foreground">
					{decode(i18n.t("snapps.helpers.has-secret"))}
				</p>
			</Label>
		</div>
		<div class="flex items-center">
			<Switch id="secret" bind:checked={hasSecret} onCheckedChange={() => {}} />
		</div>
	</div>
	{#if hasSecret}
		<div class="grid" transition:fly|global={{ duration: 400, y: 25 }}>
			<Form.Field {form} name="secret" class="mb-2">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="px-2">{i18n.t("snapps.fields.secret")}</Form.Label>
						<Input
							icon="key"
							placeholder={i18n.t("snapps.placeholders.secret")}
							{...props}
							bind:value={formData.secret}
							onblur={() => {}}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	{/if}
</div>
