<script lang="ts">
	import GroupIcon from '@lucide/svelte/icons/group';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import { invalidateAll } from '$app/navigation';
	import Dialog from '$lib/components/blocks/commons/dialog.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Table from '$lib/components/ui/table';
	import { Debouncer } from '$lib/hooks/debounce.svelte.js';
	import { m } from '$lib/paraglide/messages';
	import { createTeam } from '$lib/remotes/organizations.remote.js';
	import { slugify } from '$lib/utils.js';
	import { toast } from 'svelte-sonner';

	let {
		organizationId,
		roles,
		showCreate = $bindable()
	}: {
		organizationId: string;
		roles:
			| {
					createdAt: Date;
					id: string;
					organizationId: string;
					permission: string;
					role: string;
					updatedAt: Date | null;
			  }[]
			| undefined;
		showCreate: boolean;
	} = $props();

	let id = $props.id();
	const d = new Debouncer();

	let permissions = $state<Record<string, ('cancel' | 'create' | 'delete' | 'read' | 'update')[]>>({
		owner: ['create', 'delete', 'read', 'update'] as const
	});
	const togglePermission = (
		role: string,
		perm: 'cancel' | 'create' | 'delete' | 'read' | 'update',
		v: boolean
	) => {
		if (role === 'owner') permissions[role] = ['create', 'delete', 'read', 'update'] as const;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const current = new Set(permissions[role] ?? []);

		if (v) current.add(perm);
		else current.delete(perm);

		permissions[role] = [...current];
	};
</script>

<Dialog
	title={m.teams_create_new()}
	description={m.teams_create_new_helper()}
	bind:open={showCreate}
>
	<form
		{...createTeam.enhance(async ({ submit }) => {
			try {
				await submit();
				if (createTeam.result === true) {
					await invalidateAll();
					setTimeout(() => {
						showCreate = false;
					}, 250);
				} else toast.error(m.errors_generic());
			} catch (error) {
				console.error(error);
				const message = (error as { body?: { message?: string } })?.body?.message;
				toast.error(message || m.errors_generic());
			}
		})}
	>
		<input type="text" name="organizationId" hidden value={organizationId} />
		<Field.FieldSet class="w-full max-w-md gap-2">
			<Field.Field
				id="{id}-name"
				data-invalid={Array.isArray(createTeam.fields.name.issues())}
				class="w-full shrink-0"
			>
				<Field.Label for="name">{m.name()}</Field.Label>
				<InputGroup.Root>
					<InputGroup.Addon><GroupIcon class="size-5!" /></InputGroup.Addon>
					<InputGroup.Input
						id="name"
						placeholder={m.placeholder_teams_name()}
						oninput={(e) => {
							const value = e.currentTarget.value;
							d.debounce(() => {
								const input = document.getElementById('slug') as HTMLInputElement;
								if (input) input.value = slugify(value);
							}, 250)();
						}}
						{...createTeam.fields.name.as('text')}
					/>
				</InputGroup.Root>
				{#each createTeam.fields.name.issues() as issue (issue)}
					<Field.Error>{issue.message}</Field.Error>
				{:else}
					<Field.Description>{m.helpers_teams_name()}</Field.Description>
				{/each}
			</Field.Field>
			<Field.Field class="h-45! overflow-hidden">
				<Field.Label for="permission" class="mb-1">{m.permissions()}</Field.Label>
				<Table.Root class="border overflow-hidden">
					<Table.Header>
						<Table.Row class="divide-x">
							<Table.Head>{m.organization()}</Table.Head>
							<Table.Head class="text-center">{m.create()}</Table.Head>
							<Table.Head class="text-center">{m.read()}</Table.Head>
							<Table.Head class="text-center">{m.update()}</Table.Head>
							<Table.Head class="text-center">{m.delete()}</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						<svelte:boundary>
							{#snippet pending()}
								<Table.Row
									><Table.Cell
										><div class="h-35! flex flex-col justify-center items-center">
											<LoaderIcon />
										</div></Table.Cell
									></Table.Row
								>
							{/snippet}
							{#each await roles as { id, role } (id)}
								<Table.Row class="divide-x">
									<Table.Cell>
										{(() => {
											switch (role) {
												case 'admin':
													return m.admin();
												case 'member':
													return m.member();
												case 'owner':
													return m.owner();
											}
										})()}
									</Table.Cell>
									<Table.Cell class="p-0!">
										<Label class="mx-auto flex w-full justify-center p-2">
											<Checkbox
												disabled={role === 'owner'}
												bind:checked={
													() => permissions?.[role]?.includes('create') || false,
													(v: boolean) => togglePermission(role, 'create', v)
												}
											/>
										</Label>
									</Table.Cell>
									<Table.Cell class="p-0!">
										<Label class="mx-auto flex w-full justify-center p-2">
											<Checkbox
												disabled={role === 'owner'}
												bind:checked={
													() => permissions?.[role]?.includes('read') || false,
													(v: boolean) => togglePermission(role, 'read', v)
												}
											/>
										</Label>
									</Table.Cell>
									<Table.Cell class="p-0!">
										<Label class="mx-auto flex w-full justify-center p-2">
											<Checkbox
												disabled={role === 'owner'}
												bind:checked={
													() => permissions?.[role]?.includes('update') || false,
													(v: boolean) => togglePermission(role, 'update', v)
												}
											/>
										</Label>
									</Table.Cell>
									<Table.Cell class="p-0!">
										<Label class="mx-auto flex w-full justify-center p-2">
											<Checkbox
												disabled={role === 'owner'}
												bind:checked={
													() => permissions?.[role]?.includes('delete') || false,
													(v: boolean) => togglePermission(role, 'delete', v)
												}
											/>
										</Label>
									</Table.Cell>
								</Table.Row>
							{/each}
						</svelte:boundary>
					</Table.Body>
				</Table.Root>
				<input hidden name="permissions" value={JSON.stringify(permissions)} />
			</Field.Field>
			<Button type="submit" class="mt-2">{m.save_changes()}</Button>
		</Field.FieldSet>
	</form>
</Dialog>
