<script lang="ts">
	import type { FormEventHandler } from 'svelte/elements';

	import P from '$lib/components/typography/text/p.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { MediaQuery } from 'svelte/reactivity';

	const isDesktop = new MediaQuery('(min-width: 768px)');

	import type { User } from '@prisma/client';

	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { formatTimeAgo } from '$lib/utils';
	import { decode } from 'html-entities';
	import papa from 'papaparse';
	import { toast } from 'svelte-sonner';
	import { SvelteMap } from 'svelte/reactivity';

	import { FieldSelector } from '.';
	import UserSelector from './userSelector.svelte';
	const { user }: { user: User } = $props();
	const i18n = getTranslations();

	let fileInput = $state<HTMLInputElement>();
	let files = $state<FileList>();
	const handleUpload: FormEventHandler<HTMLInputElement> = async () => {
		if (!files?.length) {
			parsing = false;
			return toast.error(i18n.t('migrations.invalid-file'));
		}
		parsing = true;

		const file = files[0];
		if (!file.name.endsWith('.csv')) return toast.error(i18n.t('migrations.invalid-file'));

		const rawData = papa.parse(await file.text(), { header: true }).data as string[];
		const keys = new Set(Object.keys(rawData[0]));

		structuredFields.set('0', keys);
		updateSnappStructure(keys);
		parsing = false;
		parsedTable = false;
	};

	const parseTableWithSnappStructure = async () => {
			if (!files?.length) {
				return toast.error('No file uploaded');
			}
			
			const file = files[0];
			if (!file.name.endsWith('.csv')) return toast.error('Invalid file type');
			
			const rawData = papa.parse(await file.text(), { header: true }).data as Record<
			string,
			string
		>[];

		if (!rawData.length) return toast.error('No data found in file');
		
		parsedData = rawData
		.map((row) => {
				const groupId =
				((row?.[snappStructure.groupId!] as string)?.trim() !== '' &&
						(row?.[snappStructure.groupId!] as string)) ||
						null;
				const snapp = {
					createdAt:
					(snappStructure.createdAt && new Date(row?.[snappStructure.createdAt!])) || new Date(),
					disabled:
					(typeof row?.[snappStructure.disabled!] === 'boolean' &&
							Boolean(row?.[snappStructure.disabled!])) ||
						row?.[snappStructure.disabled!] === 'true' ||
						false,
						expiresAt:
						(row?.[snappStructure.expiresAt!] && new Date(row?.[snappStructure.expiresAt!])) || null,
						group:
						(groupId && {
							connectOrCreate: {
								create: { name: groupId, notes: null, slug: groupId, users: [] },
								where: { slug: groupId }
							}
						}) ||
						undefined,
						groupId: groupId || undefined,
						hit: parseInt(row?.[snappStructure.hit!] || '0'),
						maxUsages: parseInt(row?.[snappStructure.maxUsages!] || '0'),
						notes: row?.[snappStructure.notes!] || null,
						originalUrl: row?.[snappStructure.originalUrl!],
						secret: row?.[snappStructure.secret!] || null,
						shortcode: row?.[snappStructure.shortcode!],
						userId: user.id,
						utmParams: row?.[snappStructure.utmParams!]
				};
				return snapp;
			})
			.filter((p) => p?.shortcode);
			
		parsedTable = true;

	};
	
	let parsedData = $state<
		{ [key: string]: boolean | Date | null | number | object | string | undefined }[]
	>([]);

	let structuredFields: SvelteMap<string, Set<string>> = $state(new SvelteMap());
	let parsing = $state<boolean | null>(null);
	let snappStructure = $state<{
		createdAt: string | undefined;
		disabled: string | undefined;
		expiresAt: string | undefined;
		groupId: string | undefined;
		hit: string | undefined;
		maxUsages: string | undefined;
		notes: string | undefined;
		originalUrl: string | undefined;
		secret: string | undefined;
		shortcode: string | undefined;
		utmParams: string | undefined;
	}>({
		createdAt: undefined,
		disabled: undefined,
		expiresAt: undefined,
		groupId: undefined,
		hit: undefined,
		maxUsages: undefined,
		notes: undefined,
		originalUrl: undefined,
		secret: undefined,
		shortcode: undefined,
		utmParams: undefined
	});

	let users = $state<User[]>([user]);

	let parsedTable = $state(false);


	const updateSnappStructure = (fields: Set<string>) => {
		snappStructure.createdAt =
			(fields.has('created') && 'created') || (fields.has('createdAt') && 'createdAt') || undefined;
		snappStructure.disabled =
			(fields.has('disabled') && 'disabled') || (fields.has('banned') && 'banned') || undefined;
		snappStructure.expiresAt =
			(fields.has('expiration') && 'expiration') ||
			(fields.has('expiresAt') && 'expiresAt') ||
			undefined;
		snappStructure.hit = (fields.has('hit') && 'hit') || undefined;
		snappStructure.maxUsages =
			(fields.has('maxUsages') && 'maxUsages') ||
			(fields.has('max_usages') && 'max_usages') ||
			undefined;
		snappStructure.notes =
			(fields.has('description') && 'description') || (fields.has('notes') && 'notes') || undefined;
		snappStructure.originalUrl =
			(fields.has('original_url') && 'original_url') ||
			(fields.has('originalUrl') && 'originalUrl') ||
			undefined;
		snappStructure.groupId =
			(fields.has('groupId') && 'groupId') || (fields.has('tagId') && 'tagId') || undefined;
		snappStructure.utmParams = (fields.has('utmParams') && 'utmParams') || undefined;
		snappStructure.secret =
			(fields.has('secret') && 'secret') || (fields.has('password') && 'password') || undefined;
		snappStructure.shortcode =
			(fields.has('shortcode') && 'shortcode') ||
			(fields.has('short_code') && 'short_code') ||
			undefined;
	};

	const siblingCount = $derived(isDesktop.current ? 1 : 0);

	let currentPage = $state(1);
	let start = $derived((currentPage - 1) * 5);
	let end = $derived(start + 5);

	const loadURLSToDB = async () => {
		if (parsedData.length === 0) return;
		uploading = true;

		document.forms.namedItem('load-csv')?.requestSubmit();
	};
	let uploading = $state(false);

</script>

<form
	id="load-csv"
	method="post"
	action="?/migrate"
	use:enhance={({ formData }) => {
		const parsed = $state
			.snapshot(parsedData)
			.filter((p) => 'shortcode' in p && (p.shortcode as string)?.trim() !== '');
		
		for (const item of parsed) {
			formData.append('snapp[]', JSON.stringify(item));
		}
		return async ({ result }) => {
			await applyAction(result);
			uploading = false;
			parsedTable = false;
			parsing = false;
			if (result.status === 200) await goto('/dashboard');
		};
	}}
></form>
<Tabs.Content value="import" class="h-full w-full">
	<P class="mt-4 text-sm text-muted-foreground">
		{decode(i18n.t('migrations.import-helper'))}
	</P>
	<div class="mt-8 grid gap-4">
		<input
			type="file"
			accept="text/csv,application/json"
			onchange={handleUpload}
			hidden
			multiple
			bind:this={fileInput}
			bind:files
		/>
		<Button
			disabled={parsing}
			variant="outline"
			onclick={() => {
				fileInput?.click();
			}}
		>
			<i class="ph ph-upload-simple text-[20px]"> </i>
			<span>
				{i18n.t('migrations.upload')}
			</span>
		</Button>
	</div>
	{#if parsing === false && parsedTable === false}
		<div class="grid gap-1">
			<FieldSelector bind:snappStructure bind:structuredFields />
			<Button
				variant="outline"
				onclick={() => {
					parseTableWithSnappStructure();
				}}>{i18n.t('migrations.labels.check-fields')}</Button
			>
		</div>
	{/if}
	{#if parsing === true}
		<div class="flex h-full w-full animate-spin items-center justify-center duration-1000">
			<div class="grid h-6 w-6 place-content-center">
				<i class="ph ph-spinner text-[24px]"></i>
			</div>
		</div>
	{/if}
	{#if parsedTable === true}
	
		 <div class="mt-4 flex w-full items-center gap-2">
			<P class="!m-0 px-4 text-sm text-muted-foreground"
				>{i18n.t('migrations.helpers.user-overwrite')}</P
			>
			<UserSelector
				bind:users
				{user}
				onChange={(userId) => {
					parsedData = parsedData.map((p) => {
						p.userId = userId;
						return p;
					});
				}}
			/>
		</div>
		<div class="grid gap-1 py-4">
			<Card.Root class="w-full overflow-hidden">
				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="capitalize">
									{i18n.t('users.roles.user')}
								</Table.Head>
								{#each Object.keys(snappStructure) as fields}
									<Table.Head class="capitalize">
										{i18n.t(fields)}
									</Table.Head>
								{/each}
							</Table.Row>
						</Table.Header>
						<Table.Body>
							 {#each (parsedData.slice(start, end)||[]) as data, idx (data.shortcode)}
								<Table.Row class="h-[72px]" id={data.shortcode as string}>
									<Table.Cell>
										<UserSelector
											bind:users
											onChange={(userId) => {
												parsedData[idx + start].userId = userId;
											}}
											{user}
											userId={data.userId as string}
										/>
									</Table.Cell>
									{#each Object.keys(snappStructure) as field}
										<Table.Cell>
											{#if ['createdAt', 'expiresAt'].includes(field)}
												{data?.[field] && formatTimeAgo(data?.[field] as Date, page.data.locale)}
											{:else if ['utmParams'].includes(field)&& (typeof data?.[field] === "string")}
												<span class="w-full text-center"
													>{JSON.parse((data?.[field] as string) || '').length ||
														decode('&mdash;')}</span
												>
											{:else if ['originalUrl'].includes(field)}
												<span
													class=" flex w-full max-w-[12ch] overflow-clip text-ellipsis whitespace-nowrap"
													>{(data?.[field] as string)?.slice?.(0, 12)}...</span
												>
											{:else if ['secret'].includes(field) && data?.[field] !== null}
												<i class="ph ph-lock text-[20px]"></i>
											{:else}
												{data?.[field]}
											{/if}
										</Table.Cell>
									{/each}
								</Table.Row>
							{/each} 
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
			<div class="flex w-full justify-between gap-4">
				<Pagination.Root
					class="mt-4 w-full"
					count={parsedData.length}
					bind:page={currentPage}
					perPage={5}
					{siblingCount}
				>
					{#snippet children({ currentPage, pages })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.PrevButton>
									<i class="ph ph-caret-left text-[20px]"></i>
									<span class="hidden sm:block"></span>
								</Pagination.PrevButton>
							</Pagination.Item>
							{#each pages as page (page.key)}
								{#if page.type === 'ellipsis'}
									<Pagination.Item>
										<Pagination.Ellipsis />
									</Pagination.Item>
								{:else}
									<Pagination.Item>
										<Pagination.Link {page} isActive={currentPage === page.value}>
											{page.value}
										</Pagination.Link>
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Pagination.NextButton>
									<span class="hidden sm:block"></span>
									<i class="ph ph-caret-right text-[20px]"></i>
								</Pagination.NextButton>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</div>
			<div class="mt-4 flex w-full items-center gap-4">
				<P class="!m-0 text-sm text-muted-foreground"
					>{decode(i18n.t('migrations.helpers.found', { count: parsedData.length }))}</P
				>
				<Button
					disabled={uploading}
					class="ms-auto max-w-max"
					variant="ghost"
					onclick={() => {
						parsedTable = false;
					}}>{i18n.t('globals.cancel')}</Button
				>
				<Button disabled={uploading} class="max-w-max" onclick={loadURLSToDB}
					>{i18n.t('globals.save')}
					<span
						class="inline-flex h-5 w-5 items-center justify-center"
						class:animate-spin={uploading}
						><i class="ph ph-{uploading ? 'spinner' : 'floppy-disk'} text-[20px]"></i></span
					></Button
				>
			</div>
		</div> 
	{/if}
</Tabs.Content>
