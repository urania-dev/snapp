<script lang="ts">
	import BanIcon from '@lucide/svelte/icons/ban';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import DropDraw from '$lib/components/blocks/commons/drop-draw.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Select from '$lib/components/ui/native-select';
	import { m } from '$lib/paraglide/messages';
	import { toast } from 'svelte-sonner';

	import Dialog from '../commons/dialog.svelte';

	let open = $state(false);
	let { id }: { id: string } = $props();
	let openBan = $state(false);

	let banReason = $state<string>('Banned by Admin');

	let expirationUnit = $state('minutes');
	let _exp = $state<number>(0);

	let banExpiresIn = $derived.by(() => {
		if (!_exp) return;
		const value = !isNaN(_exp) ? _exp : null;
		if (value === null) return;
		switch (expirationUnit) {
			case 'days':
				return value * 24 * 60 * 60;
			case 'hours':
				return value * 60 * 60;
			case 'minutes':
				return value * 60;
			case 'months':
				return value * 30 * 24 * 60 * 60;
			case 'weeks':
				return value * 7 * 24 * 60 * 60;
			case 'years':
				return value * 365 * 24 * 60 * 60;
		}
	});
</script>

<div class="flex w-full">
	<DropDraw
		class="w-7 h-7 ms-auto me-1"
		variant="outline"
		title={m.url()}
		items={[
			{
				Icon: EyeIcon,
				id: 'open',
				label: m.open(),
				onclick: async () => {
					await goto(resolve(`/users/[id]`, { id }));
				}
			},
			{
				Icon: PencilIcon,
				id: 'edit',
				label: m.edit(),
				onclick: async () => {
					await goto(resolve(`/users/edit/[id]`, { id }));
				}
			},
			{
				Icon: BanIcon,
				id: 'ban',
				label: m.ban(),
				onclick: async () => {
					openBan = true;
				}
			}
		]}
		bind:open><EllipsisIcon /></DropDraw
	>
</div>

<Dialog description={m.ban_user()} title={m.ban()} bind:open={openBan}>
	<form
		onsubmit={async (e) => {
			e.preventDefault();
			e.stopPropagation();
			try {
				const authClient = getAuthClient(page.data.host.origin, page.data.fetch);
				const adminRole = authClient.admin.checkRolePermission({
					permissions: {
						user: ['ban']
					},
					role: 'admin'
				});
				if (!adminRole) {
					toast.error(m.errors_unauthorized());
					return;
				}

				const res = await authClient.admin.banUser({
					banExpiresIn,
					banReason,
					userId: id
				});
				if (res.error) throw res.error;

				open = false;
				openBan = false;
				toast.success(m.banned(), {
					description: `[${banReason}] ${banExpiresIn ? `${banExpiresIn / 60} ${m.time_minutes()}` : ''}`
				});
			} catch (error) {
				console.error(error);
				toast.error(m.errors_saving_profile());
			}
		}}
	>
		<Field.FieldSet>
			<Field.Field>
				<Field.Label>{m.ban_reason()}</Field.Label>
				<InputGroup.Root>
					<InputGroup.Addon><BanIcon /></InputGroup.Addon>
					<InputGroup.Input bind:value={banReason} type="text" name="reason" />
				</InputGroup.Root>
				<Field.Description>{m.ban_reason_helper()}</Field.Description>
			</Field.Field>
			<Field.Field>
				<Field.Label>{m.ban_duration()}</Field.Label>

				<ButtonGroup class="w-full">
					<InputGroup.Root>
						<InputGroup.Addon><ClockIcon /></InputGroup.Addon>
						<InputGroup.Input
							type="number"
							class="w-2/3"
							pattern="\d+"
							style="appearance: textfield"
							bind:value={_exp}
							placeholder={m.expiration_placeholder()}
						/>
					</InputGroup.Root>
					<Select.Root bind:value={expirationUnit} class="rounded-none border-s-0 rounded-e-md">
						<Select.Option value="minutes">{m.time_minutes()}</Select.Option>
						<Select.Option value="hours">{m.time_hours()}</Select.Option>
						<Select.Option value="days">{m.time_days()}</Select.Option>
						<Select.Option value="weeks">{m.time_weeks()}</Select.Option>
						<Select.Option value="months">{m.time_months()}</Select.Option>
						<Select.Option value="years">{m.time_years()}</Select.Option>
					</Select.Root>
				</ButtonGroup>
				<Field.Description>{m.ban_duration_helper()}</Field.Description>
			</Field.Field>
		</Field.FieldSet>
		<Button class="w-full mt-4" type="submit">{m.ban()}</Button>
	</form>
</Dialog>
