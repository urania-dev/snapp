<script lang="ts">
	import * as Select from "$lib/components/ui/select";
	import { getTranslations } from "$lib/i18n/index.svelte";

	let { fields, value = $bindable() }: { fields: Set<string>; value?: string } = $props();
	const i18n = getTranslations();
	const count = $derived(fields.size);
</script>

<Select.Root type="single" bind:value>
	<Select.Trigger>{value || i18n.t("migrations.select.field", { count })}</Select.Trigger>
	<Select.Content>
		{#each fields.values() as field, idx (idx)}
			<Select.Item value={field}>
				<span class="text-sm">{field}</span>
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
