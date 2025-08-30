<script lang="ts">
	import type { Infer, SuperForm } from "sveltekit-superforms/client";

	import * as Form from "$lib/components/ui/form";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { decode } from "html-entities";
	import { fly } from "svelte/transition";

	import type { SnappSchema } from "./schema";

	import P from "../typography/text/p.svelte";
	import Button from "../ui/button/button.svelte";
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
			<Label>{decode(i18n.t("snapps.fields.has-secret"))}</Label>
			<Label>
				<p class="max-w-[90%] text-balance text-sm leading-relaxed text-muted-foreground">
					{decode(i18n.t("snapps.helpers.has-secret"))}
				</p>
			</Label>
		</div>
		<div class="flex items-center">
			<Switch
				bind:checked={hasSecret}
				onCheckedChange={(status) => {
					if (status === false) formData.secret = undefined;
				}}
			/>
		</div>
	</div>
	{#if hasSecret}
		<div class="grid" transition:fly|global={{ duration: 400, y: 25 }}>
			<Form.Field {form} name="secret" class="mb-2 grid gap-1">
				<Form.Control>
					{#snippet children({ props })}
						{#if formData.secret === undefined}
							<Form.Label class="px-2">{i18n.t("snapps.fields.secret")}</Form.Label>
							<Input
								icon="key"
								placeholder={i18n.t("snapps.placeholders.secret")}
								{...props}
								onblur={(e) => {
									const value = e.currentTarget.value;

									formData.secret = value;
									hasSecret = true;
								}}
							/>
						{:else}
							<div class="flex items-center">
								<P class="px-2 text-sm text-muted-foreground">
									{i18n.t("snapps.helpers.secret")}
								</P>
								<Button
									variant="outline"
									class="mt-1 max-w-max"
									onclick={(e) => {
										e.preventDefault();
										formData.secret = undefined;
									}}
								>
									<i class="ph ph-trash text-[20px]"></i>
								</Button>
							</div>
						{/if}
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	{/if}
</div>
