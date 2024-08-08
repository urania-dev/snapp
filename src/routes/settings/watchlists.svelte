<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import Input from '$lib/ui/input.svelte';
	import { VIRUSTOTAL_API_KEY } from '$lib/utils/constants';
	import { debounce } from '$lib/utils/debounce';
	import { outside } from '$lib/utils/outside';
	import { _ } from 'svelte-i18n';
	import type { MouseEventHandler } from 'svelte/elements';
	import { fade, fly } from 'svelte/transition';
	let show_vt_apikey = $state(false);

	import type { User } from 'lucia';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { queryParam } from 'sveltekit-search-params';
	let handle_show_vt_apikey: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.preventDefault();
		show_vt_apikey = !show_vt_apikey;
	};

	let show_lateral_panel = $state(false);
	let selected_watchlist = $state<string>();
	let handle_show_lateral_panel: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.preventDefault();
		e.stopPropagation();
		selected_watchlist = e.currentTarget.dataset.idx;
		show_lateral_panel = !show_lateral_panel;
	};
	let handle_close_lateral_panel: MouseEventHandler<HTMLButtonElement> = (e) => {
		e?.preventDefault();
		show_lateral_panel = false;
	};

	let {
		blacklist_count = $bindable(),
		whitelist_count = $bindable(),
		vtapistatus = $bindable(),
		vtapikey = $bindable(),
		whitelist_count_domains = $bindable(),
		whitelist_count_emails = $bindable(),
		whitelist_count_usernames = $bindable(),
		whitelist_domains = $bindable(),
		whitelist_emails = $bindable(),
		whitelist_usernames = $bindable(),
		blacklist_count_domains = $bindable(),
		blacklist_count_emails = $bindable(),
		blacklist_count_usernames = $bindable(),
		blacklist_domains = $bindable(),
		blacklist_emails = $bindable(),
		blacklist_usernames = $bindable(),
		_limit,
		_offset,
		save_this
	}: {
		blacklist_count: number | undefined;
		whitelist_count: number | undefined;
		vtapistatus: { active: boolean };
		vtapikey: string | undefined;
		whitelist_domains: Watchlist[];
		whitelist_emails: Watchlist[];
		whitelist_usernames: Watchlist[];
		blacklist_domains: Watchlist[];
		blacklist_emails: Watchlist[];
		blacklist_usernames: Watchlist[];
		whitelist_count_domains: number | undefined;
		whitelist_count_emails: number | undefined;
		whitelist_count_usernames: number | undefined;
		blacklist_count_domains: number | undefined;
		blacklist_count_emails: number | undefined;
		blacklist_count_usernames: number | undefined;
		_limit: number;
		_offset: number;
		save_this(field: keyof User | keyof Setting | string, value: string, table?: string): void;
	} = $props();

	let domain = $state<string>();
	let username = $state<string>();
	let active_tab = $state<'email' | 'domain' | 'username'>('domain');

	const limit = queryParam('limit', {
		defaultValue: _limit,
		encode: (value: number) => value.toString(),
		decode: (value: string | null) => (value ? parseInt(value) : null)
	});
	const query = queryParam('query');

	const enhanceList: SubmitFunction = ({ formData, cancel }) => {
		if (!domain && !username) return cancel();

		if (domain) formData.set('domain', domain);
		if (username) formData.set('username', username);

		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			domain = undefined;
			username = undefined;
		};
	};

	let id_to_delete = $state<string>();
	const enhanceRemoveFromList: SubmitFunction = ({ formData, cancel }) => {
		if (!id_to_delete) return cancel();

		if (id_to_delete) formData.set('id', id_to_delete);

		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			id_to_delete = undefined;
		};
	};

	const handle_delete_listed_item: MouseEventHandler<HTMLButtonElement> = (e) => {
		const id = e.currentTarget.dataset.idx;
		if (!id) return;
		id_to_delete = id;
		document.forms.namedItem('remove-from-list')?.requestSubmit();
	};
</script>

<form action="?/blacklist" id="blacklist" hidden method="post" use:enhance={enhanceList}></form>
<form action="?/whitelist" id="whitelist" hidden method="post" use:enhance={enhanceList}></form>
<form
	action="?/remove-from-list"
	id="remove-from-list"
	use:enhance={enhanceRemoveFromList}
	method="post"
	hidden
></form>
{#if show_lateral_panel}
	<div class="fixed inset-0 z-50 h-full w-full bg-neutral-950/50" transition:fade>
		<div
			use:outside={handle_close_lateral_panel}
			in:fly|global={{ x: '100%' }}
			class="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full max-w-md flex-col gap-4 border-s border-s-slate-500 bg-neutral-50 p-4 shadow-lg dark:bg-neutral-950 dark:shadow-white/25"
		>
			{#if selected_watchlist === 'whitelist'}
				<div class="flex w-full shrink-0 flex-col gap-4">
					<h4 class="flex items-center gap-2 text-lg font-semibold">
						<Icon ph="thumbs-up"></Icon>
						{$_('admin.labels.whitelist')}
					</h4>
					<Card css={{ card: 'p-2' }}>
						<small class="flex w-full justify-between">
							<span>{@html $_('admin.labels.domains')}</span>{#key whitelist_count_domains}<span
									in:fade>{whitelist_count_domains}</span
								>{/key}
						</small>
						<small class="flex w-full justify-between">
							<span>{@html $_('admin.labels.emails')}</span>{#key whitelist_count_emails}<span
									in:fade>{whitelist_count_emails}</span
								>{/key}
						</small>
						<small class="flex w-full justify-between">
							<span>{@html $_('admin.labels.usernames')}</span>{#key whitelist_count_usernames}<span
									in:fade>{whitelist_count_usernames}</span
								>{/key}
						</small>
					</Card>
					<Card css={{ card: 'p-2' }}>
						<Input
							name="add-whitelist"
							label={$_('admin.labels.add-whitelist')}
							icons={{
								left: 'shield'
							}}
							actions={{
								input: (event) => {
									const element = event.currentTarget;
									debounce(() => {
										element.blur();
									}, 1000)();
								},
								blur: (event) => {
									const element = event.currentTarget;
									const entity = element.value;
									switch (true) {
										case /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(entity):
											[username, domain] = entity.split('@');
											break;

										case entity.includes('.'):
											domain = entity;
											break;

										default:
											username = entity;
											break;
									}
									document.forms.namedItem('whitelist')?.requestSubmit();
									element.value = '';
								}
							}}
							css={{ 'icon-right': 'animate-pulse' }}
						/>
						<small class="w-full px-1">{@html $_('admin.helpers.add-whitelist')}</small>
					</Card>
				</div>
				<Card css={{ card: 'h-full max-h-[calc(100%_-_285px)] shrink-1 overflow-clip gap-2' }}>
					<div class="h-18 flex w-full gap-2">
						<Card
							css={{
								card: `flex-row p-0 h-10 items-center bg-transparent max-w-max overflow-clip`
							}}
						>
							<button
								class="h-full px-2 hover:bg-slate-500/35 focus:bg-slate-500/35 {active_tab ===
								'domain'
									? 'bg-slate-500/50'
									: 'bg-slate-500/15'}"
								onclick={() => (active_tab = 'domain')}
							>
								<h6 class=" font-semibold">{@html $_('admin.labels.domains')}</h6>
							</button>
						</Card>
						<Card
							css={{
								card: `flex-row p-0 h-10 items-center bg-transparent max-w-max overflow-clip`
							}}
						>
							<button
								class="h-full px-2 hover:bg-slate-500/35 focus:bg-slate-500/35 {active_tab ===
								'username'
									? 'bg-slate-500/50'
									: 'bg-slate-500/15'}"
								onclick={() => (active_tab = 'username')}
							>
								<h6 class=" font-semibold">{@html $_('admin.labels.usernames')}</h6>
							</button>
						</Card>
						<Card
							css={{
								card: `flex-row p-0 h-10 items-center bg-transparent max-w-max overflow-clip`
							}}
						>
							<button
								class="h-full px-2 hover:bg-slate-500/35 focus:bg-slate-500/35 {active_tab ===
								'email'
									? 'bg-slate-500/50'
									: 'bg-slate-500/15'}"
								onclick={() => (active_tab = 'email')}
							>
								<h6 class=" font-semibold">{@html $_('admin.labels.emails')}</h6>
							</button>
						</Card>
					</div>
					{#if active_tab === 'domain'}
						<div class="flex h-full w-full flex-col gap-2 overflow-clip overflow-y-scroll pe-4">
							{#each whitelist_domains as { id, domain }, idx}
								<div class="flex w-full" in:fly|global={{ y: 24, delay: 75 * idx }}>
									<Card css={{ card: 'h-10 p-0 overflow-clip' }}>
										<button
											data-idx={id}
											onclick={handle_delete_listed_item}
											class="flex h-full w-full flex-row items-center justify-between bg-slate-500/25 px-4 hover:bg-slate-500/50 focus:bg-slate-500/50"
										>
											<span>{domain}</span>
											<Icon ph="trash"></Icon>
										</button>
									</Card>
								</div>
							{/each}
							{#if $limit}
								{#each { length: $limit - whitelist_domains.length } as _, idx}
									<div
										class="flex w-full"
										in:fly|global={{ y: 24, delay: 75 * idx + whitelist_domains.length }}
									>
										<Card css={{ card: 'h-10 p-0 overflow-clip' }}></Card>
									</div>
								{/each}
							{/if}
						</div>
					{/if}
					{#if active_tab === 'email'}
						<div class="flex h-full w-full flex-col gap-2 overflow-clip overflow-y-scroll pe-4">
							{#each whitelist_emails as { id, domain, username }, idx}
								<div class="flex w-full" in:fly|global={{ y: 24, delay: 75 * idx }}>
									<Card css={{ card: 'h-10 p-0 overflow-clip' }}>
										<button
											data-idx={id}
											onclick={handle_delete_listed_item}
											class="flex h-full w-full flex-row items-center justify-between bg-slate-500/25 px-4 hover:bg-slate-500/50 focus:bg-slate-500/50"
										>
											<span>{username}@{domain}</span>
											<Icon ph="trash"></Icon>
										</button>
									</Card>
								</div>
							{/each}
							{#if $limit}
								{#each { length: $limit - whitelist_emails.length } as _, idx}
									<div
										class="flex w-full"
										in:fly|global={{ y: 24, delay: 75 * idx + whitelist_emails.length }}
									>
										<Card css={{ card: 'h-10 p-0 overflow-clip' }}></Card>
									</div>
								{/each}
							{/if}
						</div>
					{/if}
					{#if active_tab === 'username'}
						<div class="flex h-full w-full flex-col gap-2 overflow-clip overflow-y-scroll pe-4">
							{#each whitelist_usernames as { id, username }, idx}
								<div class="flex w-full" in:fly|global={{ y: 24, delay: 75 * idx }}>
									<Card css={{ card: 'h-10 p-0 overflow-clip' }}>
										<button
											data-idx={id}
											onclick={handle_delete_listed_item}
											class="flex h-full w-full flex-row items-center justify-between bg-slate-500/25 px-4 hover:bg-slate-500/50 focus:bg-slate-500/50"
										>
											<span>{username}</span>
											<Icon ph="trash"></Icon>
										</button>
									</Card>
								</div>
							{/each}
							{#if $limit}
								{#each { length: $limit - whitelist_usernames.length } as _, idx}
									<div
										class="flex w-full"
										in:fly|global={{ y: 24, delay: 75 * idx + whitelist_usernames.length }}
									>
										<Card css={{ card: 'h-10 p-0 overflow-clip' }}></Card>
									</div>
								{/each}
							{/if}
						</div>
					{/if}
					<div class="mb-2 flex h-10 w-full justify-between gap-4 self-end pe-4">
						<Input
							type="number"
							icons={{ left: 'rows' }}
							css={{ input: 'max-w-18 text-right', field: 'max-w-24' }}
							name="limit"
							bind:value={$limit}
						/>
						<Input
							type="text"
							icons={{ left: 'magnifying-glass' }}
							css={{ input: 'text-right placeholder:text-start' }}
							name="query"
							placeholder={$_('admin.placeholders.filter-watchlist')}
							bind:value={$query}
						/>
					</div>
				</Card>
			{/if}
			{#if selected_watchlist === 'blacklist'}
				<div class="flex w-full shrink-0 flex-col gap-4">
					<h4 class="flex items-center gap-2 text-lg font-semibold">
						<Icon ph="lock-laminated"></Icon>
						{$_('admin.labels.blacklist')}
					</h4>
					<Card css={{ card: 'p-2' }}>
						<small class="flex w-full justify-between">
							<span>{@html $_('admin.labels.domains')}</span>{#key blacklist_count_domains}<span
									in:fade>{blacklist_count_domains}</span
								>{/key}
						</small>
						<small class="flex w-full justify-between">
							<span>{@html $_('admin.labels.emails')}</span>{#key blacklist_count_emails}<span
									in:fade>{blacklist_count_emails}</span
								>{/key}
						</small>
						<small class="flex w-full justify-between">
							<span>{@html $_('admin.labels.usernames')}</span>{#key blacklist_count_usernames}<span
									in:fade>{blacklist_count_usernames}</span
								>{/key}
						</small>
					</Card>
					<Card css={{ card: 'p-2' }}>
						<Input
							name="add-blacklist"
							label={$_('admin.labels.add-blacklist')}
							icons={{
								left: 'shield'
							}}
							actions={{
								input: (event) => {
									const element = event.currentTarget;
									debounce(() => {
										element.blur();
									}, 1000)();
								},
								blur: (event) => {
									const element = event.currentTarget;
									const entity = element.value;
									switch (true) {
										case /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(entity):
											[username, domain] = entity.split('@');
											break;

										case entity.includes('.'):
											domain = entity;
											break;

										default:
											username = entity;
											break;
									}
									document.forms.namedItem('blacklist')?.requestSubmit();
									element.value = '';
								}
							}}
							css={{ 'icon-right': 'animate-pulse' }}
						/>
						<small class="w-full px-1">{@html $_('admin.helpers.add-blacklist')}</small>
					</Card>
				</div>
				<Card css={{ card: 'h-full max-h-[calc(100%_-_285px)] shrink-1 overflow-clip gap-2' }}>
					<div class="h-18 flex w-full gap-2">
						<Card
							css={{
								card: `flex-row p-0 h-10 items-center bg-transparent max-w-max overflow-clip`
							}}
						>
							<button
								class="h-full px-2 hover:bg-slate-500/35 focus:bg-slate-500/35 {active_tab ===
								'domain'
									? 'bg-slate-500/50'
									: 'bg-slate-500/15'}"
								onclick={() => (active_tab = 'domain')}
							>
								<h6 class=" font-semibold">{@html $_('admin.labels.domains')}</h6>
							</button>
						</Card>
						<Card
							css={{
								card: `flex-row p-0 h-10 items-center bg-transparent max-w-max overflow-clip`
							}}
						>
							<button
								class="h-full px-2 hover:bg-slate-500/35 focus:bg-slate-500/35 {active_tab ===
								'username'
									? 'bg-slate-500/50'
									: 'bg-slate-500/15'}"
								onclick={() => (active_tab = 'username')}
							>
								<h6 class=" font-semibold">{@html $_('admin.labels.usernames')}</h6>
							</button>
						</Card>
						<Card
							css={{
								card: `flex-row p-0 h-10 items-center bg-transparent max-w-max overflow-clip`
							}}
						>
							<button
								class="h-full px-2 hover:bg-slate-500/35 focus:bg-slate-500/35 {active_tab ===
								'email'
									? 'bg-slate-500/50'
									: 'bg-slate-500/15'}"
								onclick={() => (active_tab = 'email')}
							>
								<h6 class=" font-semibold">{@html $_('admin.labels.emails')}</h6>
							</button>
						</Card>
					</div>
					{#if active_tab === 'domain'}
						<div class="flex h-full w-full flex-col gap-2 overflow-clip overflow-y-scroll pe-4">
							{#each blacklist_domains as { id, domain }, idx}
								<div class="flex w-full" in:fly|global={{ y: 24, delay: 75 * idx }}>
									<Card css={{ card: 'h-10 p-0 overflow-clip' }}>
										<button
											data-idx={id}
											onclick={handle_delete_listed_item}
											class="flex h-full w-full flex-row items-center justify-between bg-slate-500/25 px-4 hover:bg-slate-500/50 focus:bg-slate-500/50"
										>
											<span>{domain}</span>
											<Icon ph="trash"></Icon>
										</button>
									</Card>
								</div>
							{/each}
							{#if $limit}
								{#each { length: $limit - blacklist_domains.length } as _, idx}
									<div
										class="flex w-full"
										in:fly|global={{ y: 24, delay: 75 * idx + blacklist_domains.length }}
									>
										<Card css={{ card: 'h-10 p-0 overflow-clip' }}></Card>
									</div>
								{/each}
							{/if}
						</div>
					{/if}
					{#if active_tab === 'email'}
						<div class="flex h-full w-full flex-col gap-2 overflow-clip overflow-y-scroll pe-4">
							{#each blacklist_emails as { domain, id, username }, idx}
								<div class="flex w-full" in:fly|global={{ y: 24, delay: 75 * idx }}>
									<Card css={{ card: 'h-10 p-0 overflow-clip' }}>
										<button
											data-idx={id}
											onclick={handle_delete_listed_item}
											class="flex h-full w-full flex-row items-center justify-between bg-slate-500/25 px-4 hover:bg-slate-500/50 focus:bg-slate-500/50"
										>
											<span>{username}@{domain}</span>
											<Icon ph="trash"></Icon>
										</button>
									</Card>
								</div>
							{/each}
							{#if $limit}
								{#each { length: $limit - blacklist_emails.length } as _, idx}
									<div
										class="flex w-full"
										in:fly|global={{ y: 24, delay: 75 * idx + blacklist_emails.length }}
									>
										<Card css={{ card: 'h-10 p-0 overflow-clip' }}></Card>
									</div>
								{/each}
							{/if}
						</div>
					{/if}
					{#if active_tab === 'username'}
						<div class="flex h-full w-full flex-col gap-2 overflow-clip overflow-y-scroll pe-4">
							{#each blacklist_usernames as { id, username }, idx}
								<div class="flex w-full" in:fly|global={{ y: 24, delay: 75 * idx }}>
									<Card css={{ card: 'h-10 p-0 overflow-clip' }}>
										<button
											data-idx={id}
											onclick={handle_delete_listed_item}
											class="flex h-full w-full flex-row items-center justify-between bg-slate-500/25 px-4 hover:bg-slate-500/50 focus:bg-slate-500/50"
										>
											<span>{username}</span>
											<Icon ph="trash"></Icon>
										</button>
									</Card>
								</div>
							{/each}
							{#if $limit}
								{#each { length: $limit - blacklist_usernames.length } as _, idx}
									<div
										class="flex w-full"
										in:fly|global={{ y: 24, delay: 75 * idx + blacklist_usernames.length }}
									>
										<Card css={{ card: 'h-10 p-0 overflow-clip' }}></Card>
									</div>
								{/each}
							{/if}
						</div>
					{/if}
					<div class="mb-2 flex h-10 w-full justify-between gap-4 self-end pe-4">
						<Input
							type="number"
							icons={{ left: 'rows' }}
							css={{ input: 'max-w-18 text-right', field: 'max-w-24' }}
							name="limit"
							bind:value={$limit}
						/>
						<Input
							type="text"
							icons={{ left: 'magnifying-glass' }}
							css={{ input: 'text-right placeholder:text-start' }}
							name="query"
							placeholder={$_('admin.placeholders.filter-watchlist')}
							bind:value={$query}
						/>
					</div>
				</Card>{/if}
		</div>
	</div>
{/if}

<Card css={{ card: 'gap-4' }}>
	<Card css={{ card: 'flex-row justify-between py-2' }}>
		<h4 class="text-lg font-semibold">{@html $_('admin.labels.watchlists')}</h4>
		<span class="flex items-center">
			<Icon ph="crown" size={24}></Icon>
		</span>
	</Card>
	<div class="flex w-full flex-col gap-4 md:flex-row">
		<Card css={{ card: 'gap-4' }}>
			<small class="w-full text-balance leading-relaxed">
				{$_('admin.helpers.watchlists')}
			</small>
			<button
				class="group mt-auto flex w-full items-center"
				data-idx="blacklist"
				onclick={handle_show_lateral_panel}
			>
				<Card
					css={{
						card: 'bg-slate-500/25 group-hover:bg-slate-500/75 mt-auto h-10 w-full flex-row p-0 items-center justify-between px-4'
					}}
				>
					<small
						>{@html $_('admin.labels.blacklisted-items', {
							values: { count: blacklist_count }
						})}</small
					>
					<Icon ph="arrow-right"></Icon>
				</Card>
			</button>
			<button
				class="group flex w-full items-center"
				data-idx="whitelist"
				onclick={handle_show_lateral_panel}
			>
				<Card
					css={{
						card: 'bg-slate-500/25 group-hover:bg-slate-500/75 mt-auto h-10 w-full flex-row p-0 items-center justify-between px-4'
					}}
				>
					<small
						>{@html $_('admin.labels.whitelisted-items', {
							values: { count: whitelist_count }
						})}</small
					>
					<Icon ph="arrow-right"></Icon>
				</Card>
			</button>
		</Card>
		<Card>
			<div class="relative flex w-full gap-3">
				<div class="absolute right-2 top-0.5 grid h-4 w-4 place-content-center">
					{#if vtapistatus.active === true}
						<div title="Active" class="h-4 w-4 rounded-full bg-green-500"></div>
					{:else}
						<div title="Error" class="h-4 w-4 rounded-full bg-red-500"></div>
					{/if}
				</div>
				<Input
					name={VIRUSTOTAL_API_KEY}
					type={show_vt_apikey === true ? 'text' : 'password'}
					placeholder={$_('admin.placeholders.vt-api')}
					icons={{
						left: 'shield-check',
						right: show_vt_apikey === true ? 'eye' : 'eye-closed'
					}}
					actions={{
						right: handle_show_vt_apikey,
						change: (e) => {
							e.preventDefault();
							save_this(VIRUSTOTAL_API_KEY, e.currentTarget.value, 'settings');
						},
						input: (e) => {
							const element = e.currentTarget;
							debounce(() => {
								element.blur();
							}, 1000)();
						}
					}}
					label={$_('admin.labels.vt-api')}
					bind:value={vtapikey}
				/>
			</div>
			<small class="mt-auto leading-relaxed tracking-wide">{@html $_('admin.helpers.vt-api')}</small
			>
		</Card>
	</div>
</Card>
