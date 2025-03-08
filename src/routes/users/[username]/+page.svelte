<script lang="ts">
	import type { Snapp, Tag } from '@prisma/client';

	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { columns } from '$lib/components/tables/snapps/columns.svelte';
	import DataTable from '$lib/components/tables/snapps/table.svelte';
	import H2 from '$lib/components/typography/heading/h2.svelte';
	import H4 from '$lib/components/typography/heading/h4.svelte';
	import P from '$lib/components/typography/text/p.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { formatTimeAgo } from '$lib/utils.js';
	import { decode } from 'html-entities';
	import { toast } from 'svelte-sonner';

	const { data, form } = $props();
	const i18n = getTranslations();

	interface SnappWithTags extends Snapp {
		tag: Tag[];
	}

	let role = $state(data.profile.role);
	let showRole = $state(false);
	let showResetPassword = $state(false);
	let showResetMFA = $state(false);
</script>

<div class="flex w-full flex-col">
	<div class="flex w-full items-center justify-between px-4">
		<div class="flex h-20 w-full items-center gap-2">
			<i class="ph-duotone ph-user text-[32px]"></i>
			<H2 class="m-0 p-0">{data.profile.username}</H2>
		</div>
	</div>
	<Separator />
</div>
<div class="flex w-full flex-col gap-4">
	<div class="flex w-full flex-col justify-between md:flex-row">
		<div class="flex w-full flex-col gap-4 px-5 pt-4">
			<div class="flex items-center gap-2">
				<i class="ph-duotone ph-clock text-[20px]"></i>
				<small
					>{decode(i18n.t('users.fields.created'))}: {formatTimeAgo(
						data.profile.createdAt,
						page.data.locale
					)}
				</small>
			</div>
			<div class="flex items-center gap-2">
				<i class="ph-duotone ph-user-check text-[20px]"></i>
				<small
					>{decode(i18n.t('users.fields.updated'))}: {formatTimeAgo(
						data.profile.updatedAt,
						page.data.locale
					)}
				</small>
			</div>
			<div class="flex items-center gap-2">
				<i class="ph-duotone ph-envelope text-[20px]"></i>
				<a class="link block h-max pb-1 leading-[1]" href="mailto:{data.profile.email}">
					<small>{data.profile.email}</small>
				</a>
			</div>
			<div class="flex items-center gap-2">
				<i class="ph-duotone ph-link-simple-horizontal text-[20px]"></i>
				<small>{decode(i18n.t('globals.count'))}: {data.rowCount}</small>
			</div>
		</div>
		<div class="flex w-full flex-col items-end gap-2 px-5 pt-4">
			<div class="flex w-full flex-col items-end gap-2">
				<Dialog.Root bind:open={showResetPassword}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button onclick={() => {}} class="h-8 w-full lg:max-w-max" {...props}>
								<i class="ph ph-password text-[20px]"></i>
								<span>{decode(i18n.t('users.auth.recover-password'))}</span>
							</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="max-w-sm pt-4">
						<H4>{i18n.t('users.auth.recover-password')}</H4>
						<P class="!mt-0 pt-0 text-sm text-muted-foreground"
							>{decode(i18n.t('users.auth.helpers.recover-password'))}</P
						>
						<div class="flex w-full gap-4">
							<form
								method="post"
								class="contents"
								action="?/reset-password"
								use:enhance={({ formData }) => {
									formData.set('id', data.profile.id);
									formData.set('email', data.profile.email);
									return async ({ result }) => {
										await applyAction(result);
										await invalidateAll();
										if (form?.message) toast.info(decode(i18n.t(form.message)));
										if (showResetPassword) showResetPassword = false;
									};
								}}
							>
								<Dialog.Close class="h-8 w-full text-sm"
									>{decode(i18n.t('globals.cancel'))}</Dialog.Close
								>
								<Button type="submit" class="h-8 w-full"
									>{decode(i18n.t('users.auth.helpers.send-email'))}</Button
								>
							</form>
						</div>
					</Dialog.Content>
				</Dialog.Root>
				<Dialog.Root bind:open={showResetMFA}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button onclick={() => {}} class="h-8 w-full lg:max-w-max" {...props}>
								<i class="ph ph-barcode text-[20px]"></i>
								<span>{decode(i18n.t('users.auth.reset-mfa'))}</span>
							</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="max-w-sm pt-4">
						<H4>{i18n.t('users.auth.reset-mfa')}</H4>
						<P class="!mt-0 pt-0 text-sm text-muted-foreground"
							>{decode(i18n.t('users.auth.helpers.reset-mfa-for-user'))}</P
						>
						<div class="flex w-full gap-4">
							<form
								method="post"
								class="contents"
								action="?/reset-mfa"
								use:enhance={({ formData }) => {
									formData.set('id', data.profile.id);
									formData.set('email', data.profile.email);
									return async ({ result }) => {
										await applyAction(result);
										await invalidateAll();
										if (form?.message) toast.info(decode(i18n.t(form.message)));
										if (showResetMFA) showResetMFA = false;
									};
								}}
							>
								<Dialog.Close class="h-8 w-full text-sm"
									>{decode(i18n.t('globals.cancel'))}</Dialog.Close
								>
								<Button type="submit" class="h-8 w-full">{decode(i18n.t('globals.confirm'))}</Button
								>
							</form>
						</div>
					</Dialog.Content>
				</Dialog.Root>
				<Dialog.Root bind:open={showRole}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button onclick={() => {}} class="h-8 w-full lg:max-w-max" {...props}>
								<i class="ph ph-crown text-[20px]"></i>
								<span>{decode(i18n.t('users.fields.role'))}</span>
							</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="max-w-sm pt-4">
						<form
							method="post"
							class="contents"
							action="?/set-role"
							id="set-role"
							use:enhance={({ formData }) => {
								formData.set('id', data.profile.id);
								formData.set('role', role);
								return async ({ result }) => {
									await applyAction(result);
									await invalidateAll();
									if (form?.message) toast.info(decode(i18n.t(form.message)));
									if (showResetMFA) showResetMFA = false;
								};
							}}
						>
							<H4>{i18n.t('users.fields.role')}</H4>
							<Select.Root
								type="single"
								bind:value={role}
								onValueChange={() => {
									if (role !== data.profile.role)
										document.forms.namedItem('set-role')?.requestSubmit?.();
								}}
							>
								<!-- disabled={data.profile.role==='root'} -->
								<Select.Trigger class="w-full">
									<!-- disabled={data.profile.role==='root'} -->
									<span>
										{#if role === 'user'}{i18n.t('users.roles.user')}{/if}
										{#if role === 'admin'}{i18n.t('users.roles.admin')}{/if}
										{#if role === 'root'}{i18n.t('users.roles.root')}{/if}
									</span>
								</Select.Trigger>
								<Select.Content>
									<Select.Item class="font-semibold" value="user"
										>{i18n.t('users.roles.user')}</Select.Item
									>
									<Select.Item class="font-semibold" value="admin"
										>{i18n.t('users.roles.admin')}</Select.Item
									>
								</Select.Content>
							</Select.Root>
							<P class="!mt-0 px-2 pt-0 text-sm text-muted-foreground"
								>{decode(i18n.t('users.helpers.admin'))}</P
							>
						</form>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		</div>
	</div>
	<Separator />
	<div class="grid w-full">
		<DataTable
			limit={data.limit}
			columns={columns(i18n, false)}
			data={data.snapps as SnappWithTags[]}
			rowCount={data.rowCount}
			pageCount={data.pageCount}
			page={Math.floor(parseInt(data.page))}
			tableHeightRem={35}
		></DataTable>
	</div>
</div>
