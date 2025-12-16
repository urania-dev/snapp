<script lang="ts">
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import Link2Icon from '@lucide/svelte/icons/link-2';
	import SnailIcon from '@lucide/svelte/icons/snail';
	import { invalidateAll } from '$app/navigation';
	import Dialog from '$lib/components/blocks/commons/dialog.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Debouncer } from '$lib/hooks/debounce.svelte.js';
	import { m } from '$lib/paraglide/messages';
	import { createOrganization } from '$lib/remotes/organizations.remote.js';
	import { slugify } from '$lib/utils.js';
	import { toast } from 'svelte-sonner';

	let { showCreate = $bindable() }: { showCreate: boolean } = $props();

	let id = $props.id();
	const d = new Debouncer();
</script>

<Dialog
	title={m.organizations_create_one()}
	description={m.organizations_helper()}
	bind:open={showCreate}
>
	<form
		{...createOrganization.enhance(async ({ submit }) => {
			try {
				await submit();
				await invalidateAll();
				showCreate = false;
			} catch (error) {
				console.error(error);
				const message = (error as { body?: { message?: string } })?.body?.message;
				toast.error(message || m.errors_generic());
			}
		})}
	>
		<Field.FieldSet class="w-full max-w-md gap-2">
			<Field.Field
				id="{id}-name"
				data-invalid={Array.isArray(createOrganization.fields.name.issues())}
				class="w-full shrink-0"
			>
				<Field.Label for="name">{m.name()}</Field.Label>
				<InputGroup.Root>
					<InputGroup.Addon><BuildingIcon class="size-5!" /></InputGroup.Addon>
					<InputGroup.Input
						id="name"
						placeholder={m.placeholder_organization_name()}
						oninput={(e) => {
							const value = e.currentTarget.value;
							d.debounce(() => {
								const input = document.getElementById('slug') as HTMLInputElement;
								if (input) input.value = slugify(value);
							}, 250)();
						}}
						{...createOrganization.fields.name.as('text')}
					/>
				</InputGroup.Root>
				{#each createOrganization.fields.name.issues() as issue (issue)}
					<Field.Error>{issue.message}</Field.Error>
				{:else}
					<Field.Description>{m.helpers_organization_name()}</Field.Description>
				{/each}
			</Field.Field>
			<Field.Field
				id="{id}-slug"
				data-invalid={Array.isArray(createOrganization.fields.slug.issues())}
				class="w-full shrink-0"
			>
				<Field.Label for="slug">{m.slug()}</Field.Label>
				<InputGroup.Root>
					<InputGroup.Addon><SnailIcon class="size-5!" /></InputGroup.Addon>
					<InputGroup.Input
						id="slug"
						placeholder={m.placeholder_organization_slug()}
						{...createOrganization.fields.slug.as('text')}
					/>
				</InputGroup.Root>
				{#each createOrganization.fields.slug.issues() as issue (issue)}
					<Field.Error>{issue.message}</Field.Error>
				{:else}
					<Field.Description>{m.helpers_organization_slug()}</Field.Description>
				{/each}
			</Field.Field>
			<Field.Field
				id="{id}-origin"
				data-invalid={Array.isArray(createOrganization.fields.origin.issues())}
				class="w-full shrink-0"
			>
				<Field.Label for="origin">{m.origin()}</Field.Label>
				<InputGroup.Root>
					<InputGroup.Addon><Link2Icon class="size-5!" /></InputGroup.Addon>
					<InputGroup.Input
						id="origin"
						placeholder={m.placeholder_organization_origin()}
						{...createOrganization.fields.origin.as('text')}
					/>
				</InputGroup.Root>
				{#each createOrganization.fields.origin.issues() as issue (issue)}
					<Field.Error>{issue.message}</Field.Error>
				{:else}
					<Field.Description>{m.helpers_organization_origin()}</Field.Description>
				{/each}
			</Field.Field>
			<Button type="submit" class="mt-2">{m.save_changes()}</Button>
		</Field.FieldSet>
	</form>
</Dialog>
