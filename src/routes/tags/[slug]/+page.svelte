<script lang="ts">
	import Card from '$lib/ui/card.svelte';

	import Icon from '$lib/ui/icon.svelte';
	import Input from '$lib/ui/input.svelte';
	import { outside } from '$lib/utils/outside';
	import { _ } from 'svelte-i18n';
	import { fade, fly } from 'svelte/transition';
	import { toast } from '$lib/svelte-sonner';

	import type { MouseEventHandler } from 'svelte/elements';
	import { applyAction, enhance } from '$app/forms';
	import { intlFormatDistance } from 'date-fns';
	import { invalidateAll } from '$app/navigation';
	import { debounce } from '$lib/utils/debounce';
	import { cn } from '$lib/utils/cn.js';

	import { queryParam } from 'sveltekit-search-params';
	import type { SubmitFunction } from '@sveltejs/kit';
	let { data } = $props();
	let user_action = $state<'link' | 'unlink'>();
	let show_add_user_panel = $state(false);
	let show_column_panel = $state(false);

	function getRelativeDate(date: Date) {
		const rel = intlFormatDistance(date, new Date(), { locale: data.lang });
		return rel;
	}

	let innerWidth = $state<number>(0);
	let snapps = $derived(data.tag.snapps || []);

	const query = queryParam('query');
	const userQuery = queryParam('user-query');
	const limit = queryParam('limit', {
		defaultValue: data.limit as number | undefined,
		decode: (val: string | null) => (val ? parseInt(val) : null),
		encode: (val: number) => val.toString()
	});
	const orderBy = queryParam('order-by', {
		encode: (str: string) => str as string,
		decode: (str: string | null) => str as string | null,
		defaultValue: undefined as string | undefined
	});
	const ascending = queryParam('ascending', {
		defaultValue: undefined as boolean | undefined,
		encode: (booleanValue) => booleanValue.toString(),
		decode: (stringValue) => stringValue !== null && stringValue !== 'false'
	});
	const pageParam = queryParam('page', {
		defaultValue: 1,
		encode: (number) => number.toString(),
		decode: (stringedNumber) => (stringedNumber && parseInt(stringedNumber)) || null
	});
	const max_pages = $derived(Math.ceil((data.tag._count?.snapps || 0) / ($limit || data.limit)));

	const default_columns = ['shortcode', 'secret', 'created', 'expiration', 'userId'];

	let columns = $state(data.cols.length ? data.cols : default_columns);
	const handle_select_column: MouseEventHandler<HTMLButtonElement> = (e) => {
		const column = e.currentTarget.dataset.idx;
		if (!column) return;
		if (columns.includes(column)) columns = columns.filter((c) => c !== column);
		else columns.push(column);
		debounce(() => {
			show_column_panel = false;
			document.forms.namedItem('save-columns')?.requestSubmit();
		}, 2500)();
	};
	const enhanceSaveColumn: SubmitFunction = ({ formData }) => {
		formData.set('columns', JSON.stringify(columns));
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			toast.info($_($_('settings.saved')));
		};
	};

	let limitValue = $state<number>(data.limit);

	const enhanceRows: SubmitFunction = ({ formData }) => {
		formData.set('rows', limitValue.toString());
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			toast.info($_('settings.saved'));
			$limit = limitValue;
		};
	};

	let userToAdd = $state<string>();
	let userAction = $state<string>();

	const enhanceUserAction: SubmitFunction = ({ formData }) => {
		if (userToAdd) formData.set('id', userToAdd);
		if (userAction) formData.set('action', userAction);

		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			toast.info($_('settings.saved'));
			userToAdd = undefined;
			userAction = undefined;
		};
	};

	const handle_user: MouseEventHandler<HTMLButtonElement> = (e) => {
		const idx = e.currentTarget.dataset.idx;
		const action = e.currentTarget.dataset.action;
		if (idx) {
			userToAdd = idx;
			userAction = action;
			document.forms.namedItem('handle-user')?.requestSubmit();
		}
	};
</script>

<svelte:window bind:innerWidth />
<form method="post" action="?/save-rows" use:enhance={enhanceRows} id="save-rows" hidden></form>
<form
	action="?/save-cols"
	id="save-columns"
	hidden
	use:enhance={enhanceSaveColumn}
	method="post"
></form>
<svelte:head>
	<title>{$_('appname')} | {data.tag.name}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>

{#if data.is_admin && show_add_user_panel}
	<div class="fixed inset-0 z-[29] flex flex-col bg-neutral-950/50" transition:fade>
		<div
			use:outside={() => {
				show_add_user_panel = false;
			}}
			class="z-30 m-auto flex rounded w-full max-w-sm flex-col gap-4 text-balance border border-slate-500/50 bg-neutral-50 p-4 leading-relaxed text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50"
			transition:fly={{ y: 25 }}
		>
			<h4>{$_('tags.labels.add-user')}</h4>
			<Card>
				<div class="flex w-full flex-col gap-4 h-full">
					<form
						hidden
						id="handle-user"
						method="post"
						action="?/handle-user"
						use:enhance={enhanceUserAction}
					></form>
					<Input
						name="search"
						placeholder={$_('users.placeholders.search')}
						css={{
							field: 'max-h-10 md:max-h-10 p-0 flex-row',
							input: 'text-sm max-h-10 md:max-h-10',
							group: 'max-h-10 min-h-10 md:max-h-10 md:min-h-10',
							label: 'hidden'
						}}
						icons={{ left: 'magnifying-glass' }}
						bind:value={$userQuery}
					/>
					<div class="flex flex-col gap-2 items-center">
						{#each data.users as user}
							<Card css={{ card: 'h-10 p-0 px-4 items-center flex-row' }}>
								<button
									data-action={data.tag.users?.map((t) => t.id).includes(user.id)
										? 'disconnect'
										: 'connect'}
									data-idx={user.id}
									class="flex items-center w-max p-0 h-max gap-2"
									onclick={handle_user}
								>
									{#if data.tag.users?.map((u) => u.id).includes(user.id)}
										<Icon ph="tag-simple" style="fill" />
									{:else}
										<Icon ph="tag-simple" />
									{/if}
									<small class="text-sm">{user.username}</small>
								</button>
							</Card>
						{/each}
						{#each { length: Math.max(0, 5 - data.users.length) } as tag}
							<Card css={{ card: 'h-10 p-0 px-4 items-center flex-row' }}></Card>
						{/each}
					</div>
				</div>

				<div class="flex w-full mt-4 gap-4">
					<button
						onclick={() => {
							show_add_user_panel = false;
						}}
						class="flex h-12 md:h-10 w-full items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
						><small class="pt-0.5 font-semibold">
							{$_('globals.close')}
						</small>
					</button>
				</div>
			</Card>
		</div>
	</div>
{/if}

<div class="flex w-full grow flex-col p-4 shrink-0">
	<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-4">
		<a class="flex gap-2 font-semibold uppercase tracking-wider" href="/tags"
			><Icon ph="arrow-left" /><small class="text-sm">{$_('globals.back')}</small></a
		>
		<div class="flex h-8 items-center gap-2">
			<Icon ph="tag-simple" size={36} />
			<h2 class="text-lg font-bold">
				{data.tag.name}
			</h2>
		</div>
		<div class="flex grow w-full">
			<Card css={{ card: 'gap-4' }}>
				<div class="flex w-full items-center gap-4">
					<Card css={{ card: 'md:flex-row justify-between gap-4 p-2' }}>
						<h4 class="whitespace-nowrap ps-2 text-lg font-semibold">{$_('snapps.label')}</h4>
						{#if data.tagsAsPrefix === true && data.is_admin}
							<button
								onclick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									show_add_user_panel = true;
									user_action = 'link';
								}}
								class="flex h-12 w-full items-center gap-2 rounded border border-slate-500/50 p-0 px-2 text-sm font-semibold hover:bg-slate-500 hover:text-neutral-50 md:h-8 md:w-max md:justify-center"
							>
								<Icon ph="plus" />
								<span class="ps-3 md:p-0">{$_('tags.labels.manage-users')}</span>
							</button>
						{/if}
					</Card>
				</div>
				<Card
					css={{
						card: 'p-2 items-start w-full grow overflow-clip overflow-x-scroll shrink-0'
					}}
				>
					{#if snapps.length}
						<table class="w-full table-auto text-sm">
							<thead>
								<tr class="table-row h-10">
									{#if columns.includes('shortcode')}
										<th class="table-cell px-2">
											<button
												class="flex h-full w-full items-center justify-start gap-2 text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'shortcode')
														$ascending = $ascending === true ? false : true;
													else {
														$orderBy = 'shortcode';
														$ascending = false;
													}
												}}
											>
												<span>{$_('snapps.fields.shortcode')}</span>
												{#if $orderBy === 'shortcode'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									{#if columns.includes('secret')}
										<th class="table-cell px-2">
											<div
												class="flex h-full w-full items-center justify-center gap-2 text-xxs uppercase tracking-wider"
											>
												<span>{$_('snapps.fields.secret')}</span>
											</div>
										</th>
									{/if}
									{#if columns.includes('created')}
										<th class="table-cell px-2">
											<button
												class="flex h-full w-full items-center justify-start gap-2 text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'created') $ascending = $ascending ? false : true;
													else {
														$orderBy = 'created';
														$ascending = false;
													}
												}}
											>
												<span>{$_('snapps.fields.created')}</span>
												{#if $orderBy === 'created'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									{#if columns.includes('expiration')}
										<th class="table-cell px-2">
											<button
												class="flex h-full w-full items-center justify-start gap-2 text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'expiration') $ascending = $ascending ? false : true;
													else {
														$orderBy = 'expiration';
														$ascending = false;
													}
												}}
											>
												<span>{$_('snapps.fields.expiration')}</span>
												{#if $orderBy === 'expiration'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									{#if columns.includes('userId')}
										<th class="table-cell px-2">
											<button
												class="flex h-full w-full items-center justify-start gap-2 text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'users') $ascending = $ascending ? false : true;
													else {
														$orderBy = 'users';
														$ascending = false;
													}
												}}
											>
												<span>{$_('tags.labels.user')}</span>
												{#if $orderBy === 'users'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each snapps as snapp, idx}
									<tr
										class="h-14 w-full border border-slate-500/25 bg-slate-500/5 p-4 transition-all hover:bg-slate-500/15 md:h-12"
									>
										{#if columns.includes('shortcode')}
											<td class="table-cell whitespace-nowrap px-2 align-middle">
												<a class="link" href="/{data.tag.slug}/{snapp.id}">
													{snapp.shortcode}
												</a>
											</td>
										{/if}
										{#if columns.includes('secret')}
											<td class="table-cell w-10 whitespace-nowrap px-2 text-center align-middle">
												<div class="flex h-10 w-10 items-center justify-center">
													<Icon
														ph="lock-laminated"
														css={{
															icon: cn(
																'w-max h-max',
																snapp.secret === true ? 'opacity-100' : 'opacity-25'
															)
														}}
													></Icon>
												</div>
											</td>
										{/if}
										{#if columns.includes('created')}
											<td
												class="table-cell whitespace-nowrap px-2 align-middle text-xxs font-bold uppercase tracking-wider"
											>
												{getRelativeDate(snapp.created)}
											</td>
										{/if}

										{#if columns.includes('expiration')}
											<td class="table-cell whitespace-nowrap px-2 align-middle">
												<div class="flex h-full w-full items-center gap-2">
													<span
														class={cn(
															'pt-0.5 text-xxs font-bold uppercase tracking-wider ',
															snapp.expiration !== null ? 'opacity-100' : 'opacity-25'
														)}
													>
														{snapp.expiration !== null
															? getRelativeDate(snapp.expiration)
															: $_('globals.disabled')}
													</span>
												</div>
											</td>
										{/if}
										{#if columns.includes('userId')}
											<td class="table-cell whitespace-nowrap px-2 align-middle">
												<div class="flex h-full w-full items-center gap-2">
													<span class={cn('pt-0.5 text-xxs font-bold uppercase tracking-wider ')}>
														{snapp.user.username}
													</span>
												</div>
											</td>
										{/if}
										<td class="table-cell w-full whitespace-nowrap px-2 text-end align-middle">
											<div class="flex justify-end gap-2">
												<a
													target="_blank"
													href="/{data.tag.slug}/{snapp.shortcode}"
													in:fly|global={{ delay: 75 * 3, y: 24 }}
													class="flex h-10 w-10 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
													><Icon ph="arrow-square-out"></Icon>
												</a>
											</div>
										</td>
									</tr>
								{/each}
								{#each { length: data.limit - snapps.length } as _, idx}
									<tr
										class="h-14 w-full border border-slate-500/25 bg-slate-500/5 p-4 transition-all hover:bg-slate-500/15 md:h-10"
									>
										<th class="px-2 table-cell" colspan={columns.length + 1}> </th>
									</tr>
								{/each}
							</tbody>
						</table>
					{:else}
						<div class="flex h-full w-full shrink-0 flex-col items-center justify-center">
							<div class="flex rounded-full bg-slate-500/25 p-10">
								<Icon css={{ icon: 'text-pink-500/50' }} ph="magnifying-glass" size={128}></Icon>
							</div>
						</div>
					{/if}
				</Card>
				<div class="mt-auto flex w-full flex-col gap-2 md:flex-row">
					<Card css={{ card: 'w-full p-2 h-full md:flex-row justify-between' }}>
						<div class="flex w-full gap-2">
							<div class="peer transition-all w-full">
								<Input
									name="search"
									placeholder={$_('tags.labels.search')}
									css={{
										field: 'transition-all max-h-12 md:max-h-8 p-0 flex-row md:max-w-[19rem]',
										input: 'text-sm max-h-12 md:max-h-8',
										group: 'max-h-12 min-h-12 md:max-h-8 md:min-h-8',
										label: 'hidden'
									}}
									icons={{ left: 'magnifying-glass' }}
									bind:value={$query}
								/>
							</div>
							<div class="peer-focus-within:hidden">
								<Input
									name="limit"
									icons={{ left: 'rows' }}
									actions={{
										change: (e) => {
											document.forms.namedItem('save-rows')?.requestSubmit();
										},
										input: (e) => {
											debounce(
												() => document.forms.namedItem('save-rows')?.requestSubmit(),
												1000
											)();
										}
									}}
									css={{
										field: 'max-h-12  md:max-h-8 p-0 flex-row max-w-max',
										input: 'text-sm max-h-12 md:max-h-8 w-full text-center',
										group: 'max-h-12 min-h-12 md:max-h-8 md:min-h-8 w-20',
										label: 'hidden'
									}}
									bind:value={limitValue}
								/>
							</div>

							<button
								onclick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									show_column_panel = !show_column_panel;
								}}
								class="flex peer-focus-within:hidden h-12 w-12 items-center justify-center gap-2 rounded border border-slate-500/50 px-4 text-sm outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-auto"
							>
								<Icon ph="gear" css={{ icon: 'w-max h-max' }} />
								<span class="hidden text-sm font-semibold md:flex"
									>{$_('snapps.labels.columns')}</span
								>
							</button>
						</div>
						<div
							class="flex w-full items-center justify-start gap-2 p-0 font-semibold md:justify-end"
						>
							<button
								onclick={() => ($pageParam = Math.max(1, ($pageParam || 1) - 1))}
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
							>
								<Icon ph="arrow-left" />
							</button>
							<button
								onclick={() => {
									if ($pageParam && max_pages === Number($pageParam))
										toast.info($_('globals.max-page-reached'));
									$pageParam = Math.min(max_pages, Number($pageParam) + 1);
								}}
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
							>
								<Icon ph="arrow-right" />
							</button>
							<div
								class="flex w-full items-center justify-end gap-2 p-0 font-semibold md:max-w-max"
							>
								<small>
									{$_('snapps.labels.count')}
								</small>
								<small>:</small><small
									class="flex aspect-square h-8 min-w-8 shrink-0 items-center justify-center rounded bg-slate-500/15 p-2"
									>{data.tag._count?.snapps}</small
								>
							</div>
						</div>
					</Card>
				</div>
			</Card>
		</div>
	</div>
</div>

{#if show_column_panel === true}
	<div
		class="fixed inset-0 z-50 grid h-screen w-screen grid-cols-1 place-content-center bg-neutral-950/50"
		transition:fade
	>
		<div
			use:outside={() => {
				show_column_panel = false;
			}}
			class="mx-auto flex w-full max-w-sm shrink-0 flex-col rounded border border-slate-500/50 bg-neutral-50 p-2 dark:bg-neutral-950"
			transition:fly={{ y: 25 }}
		>
			<h4 class="py-2 font-semibold">{$_('snapps.labels.columns')}</h4>
			<div class="grid w-full grid-cols-2 gap-2 pb-2">
				{#each default_columns as column}
					<button data-idx={column} class="flex items-center gap-2" onclick={handle_select_column}>
						<div
							class="flex h-6 w-6 items-center justify-center rounded border border-slate-500/50 bg-neutral-50 dark:bg-neutral-950"
						>
							{#if columns.includes(column)}
								<Icon ph="check" size={16}></Icon>
							{/if}
						</div>
						<small class="font-semibold">
							{#if column === 'userId'}
								{$_('tags.labels.user')}
							{:else}
								{$_('snapps.fields.' + column.replaceAll('_', '-'))}
							{/if}
						</small>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
