<script lang="ts">
	import type { TPermissions } from '$lib/schemas/host.schema';
	import type * as schema from '$lib/server/db/auth-schema';

	import LoaderIcon from '@lucide/svelte/icons/loader';
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Field from '$lib/components/ui/field';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table';
	import { m } from '$lib/paraglide/messages';
	import { updatePermissions } from '$lib/remotes/organizations.remote';
	import { toast } from 'svelte-sonner';

	let {
		dataPermissions,
		member,
		roles,
		team
	}: {
		dataPermissions: Record<string, TPermissions>;
		member?: typeof schema.member.$inferSelect;
		roles: (typeof schema.organizationRole.$inferSelect)[];
		team: { id: string };
	} = $props();

	// svelte-ignore state_referenced_locally
	let permissions = $state(dataPermissions);
	const saveTeam = async () => {
		if (!browser) return [];
		const update = roles.map((r) => {
			return { id: r.id, p: $state.snapshot(permissions[r.role]) as TPermissions };
		});
		const res = await updatePermissions(update);
		if (res) {
			toast.success(m.settings_saved());
			await invalidateAll();
		} else {
			toast.error(m.errors_settings_saving());
			permissions = permissions;
		}
	};

	const togglePermission = (
		role: string,
		teamId: string,
		perm: TPermissions[number][number],
		v: boolean
	) => {
		permissions[role] ??= {};
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const current = new Set(permissions[role][teamId] ?? []);

		if (v) current.add(perm);
		else current.delete(perm);

		permissions[role][teamId] = [...current];
	};
</script>

{#if member && member?.role !== 'member'}
	<div
		class="flex w-full flex-col @md/column:flex-row @md/column:divide-x divide-y @md/column:divide-y-0"
	>
		<div class="p-4 flex flex-col w-full">
			<Field.Field class="overflow-hidden h-45!">
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
									><Table.Cell colspan={6}
										><div class="h-23 flex flex-col justify-center items-center">
											<LoaderIcon class="animate-spin m-auto" />
										</div></Table.Cell
									></Table.Row
								>
							{/snippet}
							{#each roles as { id, role } (id)}
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
												onCheckedChange={async () => await saveTeam()}
												bind:checked={
													() => permissions?.[role]?.[team.id]?.includes('create') || false,
													(v: boolean) => togglePermission(role, team.id, 'create', v)
												}
											/>
										</Label>
									</Table.Cell>
									<Table.Cell class="p-0!">
										<Label class="mx-auto flex w-full justify-center p-2">
											<Checkbox
												onCheckedChange={async () => await saveTeam()}
												disabled={role === 'owner'}
												bind:checked={
													() => permissions?.[role]?.[team.id]?.includes('read') || false,
													(v: boolean) => togglePermission(role, team.id, 'read', v)
												}
											/>
										</Label>
									</Table.Cell>
									<Table.Cell class="p-0!">
										<Label class="mx-auto flex w-full justify-center p-2">
											<Checkbox
												onCheckedChange={async () => await saveTeam()}
												disabled={role === 'owner'}
												bind:checked={
													() => permissions?.[role]?.[team.id]?.includes('update') || false,
													(v: boolean) => togglePermission(role, team.id, 'update', v)
												}
											/>
										</Label>
									</Table.Cell>
									<Table.Cell class="p-0!">
										<Label class="mx-auto flex w-full justify-center p-2">
											<Checkbox
												onCheckedChange={async () => await saveTeam()}
												disabled={role === 'owner'}
												bind:checked={
													() => permissions?.[role]?.[team.id]?.includes('delete') || false,
													(v: boolean) => togglePermission(role, team.id, 'delete', v)
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
		</div>
	</div>
{/if}
