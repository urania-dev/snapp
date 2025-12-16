<script lang="ts">
	import type { FormEventHandler } from 'svelte/elements';

	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { toast } from 'svelte-sonner';

	const { organizationId, originalName }: { organizationId: string; originalName: string } =
		$props();

	// svelte-ignore state_referenced_locally
	let name = $state(originalName);
	let edit = $state(false);
	let ref = $state<HTMLInputElement | null>(null);

	const save: FormEventHandler<HTMLInputElement> = async (e) => {
		edit = false;
		const authClient = getAuthClient(page.data.host.origin, page.data.fetch);
		const value = e.currentTarget.value.toString();
		if (!value || value.trim() === '') {
			toast.error(m.errors_settings_saving());
			return;
		}
		if (value === originalName) return;
		try {
			const res = await authClient.organization.update({
				data: {
					name: value
				},
				organizationId
			});

			if (res.error) throw res.error;

			toast.success(m.settings_saved());
		} catch (error) {
			console.error(error);
			toast.error(m.errors_settings_saving());
		}
	};
</script>

<Field.Field class="h-full">
	{#if !edit}
		<Button
			onclick={(e) => {
				e.stopPropagation();
				edit = true;
				setTimeout(() => {
					if (!ref) return;
					ref?.focus();
				}, 150);
			}}
			variant="ghost"
			class="px-1 justify-start h-full">{name}</Button
		>
	{:else}
		<InputGroup.Root class="h-full">
			<InputGroup.Input
				bind:ref
				onblur={save}
				onkeypress={(e) => {
					if ((e as unknown as KeyboardEvent)?.code === 'Enter') e.currentTarget.blur();
				}}
				class="px-1 h-full max-h-none"
				bind:value={name}
			/>
		</InputGroup.Root>
	{/if}
</Field.Field>
