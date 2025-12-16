<script lang="ts">
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import CrownIcon from '@lucide/svelte/icons/crown';
	import FingerprintPatternIcon from '@lucide/svelte/icons/fingerprint-pattern';
	import LinkIcon from '@lucide/svelte/icons/link-2';
	import UserRoundCogIcon from '@lucide/svelte/icons/user-round-cog';
	import UserRoundPenIcon from '@lucide/svelte/icons/user-round-pen';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import NumberCard from '$lib/components/blocks/commons/number-card.svelte';
	import UrlsTable from '$lib/components/blocks/urls/urls-table.svelte';
	import { columns } from '$lib/components/blocks/urls/urls.columns.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Field from '$lib/components/ui/field';
	import * as Item from '$lib/components/ui/item';
	import * as Select from '$lib/components/ui/native-select';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatTimeAgo } from '$lib/utils.js';
	import { toast } from 'svelte-sonner';
	import * as v from 'valibot';
	const { data } = $props();

	let showDelete = $state(false);
	let selected = $state<null | string>(null);
</script>

<div class="@container flex w-full grow flex-col">
	<div class="flex h-14 w-full items-center gap-4 border-b">
		<div class="p-4 flex gap-4 items-center">
			{#if data.member?.role === 'user'}
				<UsersRoundIcon class="size-8! fill-secondary/50" />
				<h1 class="text-2xl leading-none font-bold">{m.user()}</h1>
			{:else}
				<CrownIcon class="size-8! fill-secondary/50" />
				<h1 class="text-2xl leading-none font-bold">{m.admin()}</h1>
			{/if}
		</div>
	</div>
	<div class="grid grid-cols-6 @3xl:divide-y-0 @2xl:divide-x grow divide-y">
		<div
			class="flex w-full col-span-6 @2xl:col-span-3 @5xl:col-span-2 @container/column flex-col divide-y"
		>
			<div class="p-4 flex gap-4 items-center">
				<Avatar.Root class="size-20! rounded-md!">
					<Avatar.Image class="size-20! rounded-md!" src={data.member?.image} />
					<Avatar.Fallback
						class="size-20! bg-primary/20 border-primary border-2 uppercase rounded-md! text-2xl font-semibold"
						>{data.member?.username.slice(0, 1)}</Avatar.Fallback
					>
				</Avatar.Root>
				<div class="flex flex-col gap-1">
					<h2 class="text-2xl font-semibold leading-none">{data.member?.username}</h2>
					<p class="text-base font-medium">{data.member?.email}</p>
				</div>
			</div>
			<div
				class="flex w-full flex-col @md/column:flex-row @md/column:divide-x divide-y @md/column:divide-y-0"
			>
				<div class="p-4 flex grow @md/column:w-1/2">
					<NumberCard
						item={{
							helper: m.registered(),
							icon: UserRoundCogIcon,
							label: data.member.createdAt?.toLocaleDateString(getLocale(), {
								dateStyle: 'medium'
							}),
							number: ''
						}}
					/>
				</div>
				<div class="p-4 flex grow @md/column:w-1/2">
					<NumberCard
						item={{
							helper: m.member_last_login(),
							icon: UserRoundPenIcon,
							label:
								data.lastLogin?.toLocaleDateString(getLocale(), { dateStyle: 'medium' }) ||
								m.not_set(),
							number: ''
						}}
					/>
				</div>
			</div>
			<div
				class="flex w-full flex-col @md/column:flex-row @md/column:divide-x divide-y @md/column:divide-y-0"
			>
				<div class="p-4 flex grow @md/column:w-1/2">
					<NumberCard
						item={{
							helper: m.total_urls(),
							icon: LinkIcon,
							label: m.urls(),
							number: data.urlCount
						}}
					/>
				</div>
				<div class="p-4 flex grow @md/column:w-1/2">
					<NumberCard
						item={{
							helper: `${m.total()} · ${formatTimeAgo(new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7), getLocale())}`,
							icon: ActivityIcon,
							label: m.visits(),
							number: data.metrics
						}}
					/>
				</div>
			</div>
			<div class="flex w-full divide-x">
				<div class="p-4 flex grow w-1/2">
					<Item.Root variant="muted" class="grow">
						<Item.Content class="px-0">
							<Field.Field>
								<Field.Label>{m.role()}</Field.Label>
								<Select.Root
									name="role"
									value={data.member?.role}
									onchange={async (e) => {
										e.preventDefault();
										e.stopPropagation();
										const value = e.currentTarget.value;
										if (value === data.member?.role) return;
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
											const role = v.parse(
												v.pipe(v.union([v.literal('admin'), v.literal('user')])),
												value
											);
											await authClient.admin.setRole({ role, userId: data.member?.id });
											await invalidateAll();
											toast.success(m.settings_saved());
										} catch (err) {
											console.error(err);
											toast.error(m.errors_saving_profile());
										}
									}}
								>
									<Select.Option value="admin">{m.admin()}</Select.Option>
									<Select.Option value="user">{m.user()}</Select.Option>
								</Select.Root>
								<Field.Description class="text-balance px-0.5">{m.role_helper()}</Field.Description>
							</Field.Field>
						</Item.Content>
					</Item.Root>
				</div>
			</div>
			<div class="p-4 flex">
				<Button variant="outline" class="w-full"
					><FingerprintPatternIcon /><span>{m.reset_two_factor()}</span></Button
				>
			</div>
			{#if data.member?.banned === true}
				<div class="flex w-full divide-x grow">
					<div class="p-4 flex grow">
						<Item.Root variant="outline" class="grow bg-destructive/20 border-destructive">
							<Item.Content class="px-0">
								<Field.Field>
									<Field.Label class="text-lg">{m.banned_helper()}</Field.Label>

									<Field.Description class="text-balance flex"
										><span class="pe-2">{m.expires_at()}:</span> [ {data.member?.banExpires?.toLocaleString(
											getLocale(),
											{
												dateStyle: 'medium',
												timeStyle: 'short'
											}
										) || '--'} ]</Field.Description
									>
									<Field.Description class="text-balance flex"
										><span>{data.member?.banReason}</span></Field.Description
									>
									<Button
										variant="outline"
										class="mt-2"
										onclick={async (e) => {
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

												await authClient.admin.unbanUser({
													userId: data.member?.id
												});
												toast.success(m.settings_saved());
												await invalidateAll();
											} catch (err) {
												console.error(err);
												toast.error(m.errors_saving_profile());
											}
										}}><span>{m.revoke()}</span></Button
									>
								</Field.Field>
							</Item.Content>
						</Item.Root>
					</div>
				</div>
			{/if}
		</div>
		<div class="flex col-span-6 @2xl:col-span-3 @5xl:col-span-4 w-full flex-col">
			<UrlsTable
				data={data.urls}
				rowCount={data.urlCount}
				limit={data.limit}
				{columns}
				columnVisibility={data.columnVisibility}
				bind:showDelete
				bind:selected
				hideCreate
				tagList={data.tags}
			/>
		</div>
	</div>
</div>
