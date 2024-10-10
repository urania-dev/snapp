<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import Input from '$lib/ui/input.svelte';
	import { hover } from '$lib/utils/hover.js';
	import { intlFormatDistance } from 'date-fns';
	import { _ } from 'svelte-i18n';
	import { fade, fly } from 'svelte/transition';
	import { queryParam } from 'sveltekit-search-params';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	let { data, form } = $props();
	import { toast } from '$lib/svelte-sonner';
	import type { SubmitFunction } from './$types.js';
	import { outside } from '$lib/utils/outside.js';
	import Select from '$lib/ui/select.svelte';
	import { slugify } from '$lib/utils/slug.js';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	function getRelativeDate(date: Date) {
		const rel = intlFormatDistance(date, new Date(), { locale: data.lang });
		return rel;
	}
	const query = queryParam('query');
	const pageParam = queryParam('page', {
		defaultValue: 1,
		decode: (value) => (typeof value === 'string' ? parseInt(value) : 1),
		encode: (value) => value.toString()
	});

	let show_buttons = $state<string>();
	let show_user_panel = $state<boolean>(false);
	let show_confirm_panel = $state<boolean>(false);
	const max_pages = $derived(Math.ceil(data.count / 9));

	const enhanceUserAction: SubmitFunction = ({ formData }) => {
		if (id_to_delete) formData.set('id', id_to_delete);
		if (_user) formData.set('user', JSON.stringify(_user));
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
			id_to_delete = undefined;
			show_confirm_panel = false;
			show_user_panel = false;
			_user = empty_user;
		};
	};

	let id_to_delete = $state<string>();
	const handleDelete: MouseEventHandler<HTMLButtonElement> = (e) => {
		e?.stopPropagation();
		const idx = e.currentTarget.dataset.idx;
		if (!idx) return;
		id_to_delete = idx;
		show_confirm_panel = true;
		user_action = 'delete';
	};
	const handleEdit: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.stopPropagation();

		const idx = e.currentTarget.dataset.idx;
		if (!idx) return;
		const edit_user = data.users.find((u) => u.id === idx);
		if (edit_user) {
			_user = edit_user as typeof _user;
			user_action = 'edit';
			show_user_panel = true;
		}
	};

	let user_action = $state<'create' | 'edit' | 'delete'>();

	const empty_user = {
		id: '',
		username: '',
		email: '',
		createdAt: new Date(),
		updatedAt: new Date(),
		role: 'user',
		notes: ''
	};

	let _user = $state<Partial<(typeof data.users)[0]>>(empty_user);

	const role_icon = $derived(
		_user.role === 'admin' ? 'crown' : _user.role === 'root' ? 'lock-laminated' : 'user'
	);

	const handle_save: MouseEventHandler<HTMLButtonElement> = (e) => {
		if (user_action === 'create') {
			document.forms.namedItem('create')?.requestSubmit();
		}
		if (user_action === 'edit') {
			document.forms.namedItem('edit')?.requestSubmit();
		}
		if (user_action === 'delete') {
			document.forms.namedItem('delete')?.requestSubmit();
		}
	};

	let innerWidth = $state<number>(0);
</script>

<svelte:head>
	<title>{$_('appname')} | {$_('menu.users')}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
<svelte:window bind:innerWidth />
<form action="?/delete" id="delete" hidden method="post" use:enhance={enhanceUserAction}></form>
<form action="?/create" id="create" hidden method="post" use:enhance={enhanceUserAction}></form>
<form action="?/edit" id="edit" hidden method="post" use:enhance={enhanceUserAction}></form>

<div class="flex h-full w-full flex-col overflow-clip p-4 lg:h-full">
	<div class="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 overflow-clip lg:h-full">
		<h2 class="flex items-center gap-2 text-2xl font-bold">
			<Icon ph="users" size={36} />
			<span>{$_('menu.users')}</span>
		</h2>
		<div
			class="flex w-full overflow-clip"
			style:height={innerWidth < 1024 ? 'calc(100% - 8rem)' : '100%'}
		>
			<Card css={{ card: 'gap-4 h-full' }}>
				<Card css={{ card: 'flex md:flex-row md:h-12 gap-2 items-center justify-between p-2' }}>
					<Input
						name="search"
						placeholder={$_('users.placeholders.search')}
						css={{
							field: 'max-h-12 md:max-h-8 p-0 flex-row md:max-w-[19rem]',
							input: 'text-sm max-h-12 md:max-h-8',
							group: 'max-h-12 min-h-12 md:max-h-8 md:min-h-8',
							label: 'hidden'
						}}
						icons={{ left: 'magnifying-glass' }}
						bind:value={$query}
					/>
					<button
						onclick={(e) => {
							e.stopPropagation();
							show_user_panel = true;
							user_action = 'create';
						}}
						class="flex h-12 w-full items-center gap-2 rounded border border-slate-500/50 p-0 px-2 text-sm font-semibold hover:bg-slate-500 hover:text-neutral-50 md:h-8 md:w-max md:justify-center"
					>
						<Icon ph="user" />
						<span class="ps-3 md:p-0">{$_('users.labels.create')}</span>
					</button>
				</Card>
				<div class="flex h-full w-full flex-wrap content-start items-start gap-4 overflow-y-scroll">
					{#each data.users as user, idx}
						<div
							data-idx={user.id}
							use:hover={{
								enter: () => (show_buttons = user.id),
								exit: () => (show_buttons = undefined)
							}}
							class="w-full shrink-0 lg:h-[calc(33%_-_0.5rem)] lg:max-w-[calc(33%_-_0.475rem)]"
							in:fly|global={{ y: 24, delay: 75 * (idx + 1) }}
						>
							<Card
								css={{
									card: `leading-relaxed min-h-max h-full gap-2 ${user.role === 'admin' ? 'border-amber-500/50 bg-amber-500/5' : ''} ${user.role === 'root' ? 'border-pink-500/50 bg-pink-500/5' : ''}`
								}}
							>
								<div class="flex w-full items-center gap-2">
									{#if ['admin', 'root'].includes(user.role)}
										<Icon ph="crown" />
									{:else}
										<Icon ph="user" />
									{/if}
									<h5 class="w-full pt-0.5 font-bold">
										{user.username}
									</h5>
								</div>
								<a href="mailto:{user.email}" class="flex w-full items-center gap-2 text-sm">
									<Icon ph="envelope" />
									<span class="text-sm">
										{user.email}
									</span>
								</a>
								<div class="flex w-full items-center gap-2">
									<Icon ph="link-simple-horizontal" />
									<small>{user._count.snapps}</small>
								</div>
								<div
									class="mt-auto flex w-full flex-col items-end justify-between gap-2 md:flex-row md:gap-0"
								>
									<small class="w-full font-semibold tracking-wide"
										>{getRelativeDate(user.updatedAt)}</small
									>
									<div class="flex gap-2">
										{#if show_buttons === user.id || (innerWidth && innerWidth < 1024)}
											<button
												data-idx={user.id}
												onclick={handleDelete}
												in:fly|global={{ delay: 75, y: 24 }}
												class="flex h-12 w-12 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-red-500/50 focus:bg-red-500/50 md:h-8 md:w-8"
												><Icon ph="trash"></Icon>
											</button>
											<button
												data-idx={user.id}
												onclick={handleEdit}
												in:fly|global={{ delay: 75 * 2, y: 24 }}
												class="flex h-12 w-12 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
												><Icon ph="pencil"></Icon>
											</button>
											<a
												href="/users/{user.username}"
												in:fly|global={{ delay: 75 * 3, y: 24 }}
												class="flex h-12 w-12 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
												><Icon ph="eye"></Icon>
											</a>
										{/if}
									</div>
								</div>
							</Card>
						</div>
					{/each}
				</div>
				<Card css={{ card: 'p-2 md:h-12 flex-row justify-between' }}>
					<div class="flex w-full items-center justify-start gap-2 p-0 font-semibold">
						<button
							onclick={() => ($pageParam = Math.max(1, ($pageParam || 1) - 1))}
							class="flex h-12 w-12 items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
						>
							<Icon ph="arrow-left" />
						</button>
						<button
							onclick={() => {
								if ($pageParam && max_pages === Number($pageParam))
									toast.info($_('globals.max-page-reached'));
								$pageParam = Math.min(max_pages, Number($pageParam) + 1);
							}}
							class="flex h-12 w-12 items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
						>
							<Icon ph="arrow-right" />
						</button>
					</div>

					<div class="flex w-full items-center justify-end gap-2 p-0 font-semibold">
						<small>{$_('globals.total')} {$_('menu.users').toLowerCase()}</small>
						<small>:</small><small
							class="flex aspect-square h-8 min-w-8 shrink-0 items-center justify-center rounded bg-slate-500/15 p-2"
							>{data.count}</small
						>
					</div>
				</Card>
			</Card>
		</div>
	</div>
</div>

{#if show_user_panel === true}
	<div class="fixed inset-0 z-[29] bg-neutral-950/50" transition:fade></div>
	<div
		use:outside={() => {
			show_user_panel = false;
		}}
		class="fixed bottom-0 right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col gap-4 border-l border-slate-500/50 bg-neutral-50 p-4 text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50"
		transition:fly={{ x: '100%' }}
	>
		<h4 class="text-lg font-bold leading-relaxed tracking-wide">
			{$_(`users.labels.${user_action}`)}
		</h4>
		{#if user_action === 'create'}
			<p>{$_('users.helpers.invitation')}</p>
		{/if}
		{#if _user.id && _user.id.trim() !== ''}
			<Input
				type="text"
				name="id"
				css={{ input: 'text-sm', field: 'opacity-50' }}
				label="ID"
				icons={{ left: 'lock' }}
				disabled
				bind:value={_user.id}
			/>
		{/if}

		<Input
			type="text"
			name="username"
			actions={{
				input: (e) => {
					_user.username = slugify(e.currentTarget.value);
				}
			}}
			css={{ input: 'text-sm' }}
			label={$_('users.fields.username')}
			icons={{ left: 'user' }}
			bind:value={_user.username}
		/>
		<Input
			type="text"
			name="email"
			css={{ input: 'text-sm' }}
			label={$_('users.fields.email')}
			icons={{ left: 'envelope' }}
			bind:value={_user.email}
		/>

		<div class="flex w-full flex-col gap-2">
			<Select
				type="text"
				name="role"
				css={{ input: 'text-sm' }}
				label={$_('users.fields.role')}
				icons={{ left: role_icon }}
				disabled
				locked={_user.role === 'root'}
				items={[
					{ value: 'admin', id: 'admin' },
					{ value: 'user', id: 'user' }
				]}
				actions={{
					select: (e) => {
						e.stopPropagation();
						const role = e.currentTarget.dataset.idx;
						if (role) _user.role = role as 'user' | 'admin';
					}
				}}
				bind:value={_user.role}
			/>
			<small class="px-1">{$_('users.helpers.admin')}</small>
		</div>
		{#if _user.role === 'user' && data.enabled_limits}
			<div class="flex w-full flex-col gap-2">
				<Input
					type="number"
					name="max_snapps"
					css={{ input: 'text-sm' }}
					label={$_('users.fields.max-snapps')}
					icons={{ left: 'link-simple-horizontal' }}
					bind:value={_user.max}
				/>
				<small class="px-1">{$_('users.helpers.max-snapps')}</small>
			</div>
		{/if}
		<div class="flex h-full flex-col gap-2">
			<Input
				type="textarea"
				css={{ field: 'h-full' }}
				name="notes"
				label={$_('users.fields.notes')}
				bind:value={_user.notes}
			/>
			<small class="px-1">{$_('users.helpers.notes')}</small>
		</div>
		<div class="flex w-full gap-4">
			<button
				onclick={() => {
					show_user_panel = false;
				}}
				class="flex h-10 w-full items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
				><small class="pt-0.5 font-semibold">
					{$_('globals.close')}
				</small>
			</button>
			<button
				onclick={handle_save}
				class="flex h-10 w-full items-center justify-center gap-2 rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-green-500/50 focus:bg-green-500/50"
				><Icon ph="floppy-disk" size={16} /><small class="pt-0.5 font-semibold">
					{$_('globals.save')}
				</small>
			</button>
		</div>
	</div>
{/if}

{#if show_confirm_panel}
	<div class="fixed inset-0 z-[29] flex flex-col bg-neutral-950/50" transition:fade>
		<div
			use:outside={() => {
				show_confirm_panel = false;
			}}
			class="z-30 m-auto flex w-full max-w-sm flex-col gap-4 overflow-y-scroll text-balance border border-slate-500/50 bg-neutral-50 p-4 leading-relaxed text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50"
			transition:fly={{ y: 25 }}
		>
			<h4>{$_('globals.sure-ask')}</h4>
			<p>{$_('users.actions.confirm-delete')}</p>
			<div class="flex w-full gap-4">
				<button
					onclick={() => {
						show_confirm_panel = false;
					}}
					class="flex h-8 w-full items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
					><small class="pt-0.5 font-semibold">
						{$_('globals.cancel')}
					</small>
				</button>
				<button
					onclick={handle_save}
					class="flex h-8 w-full items-center justify-center gap-2 rounded border-none bg-red-500/25 outline-none transition-all hover:bg-red-500/50 focus:bg-red-500/50"
					><Icon ph="trash" size={16} /><small class="pt-0.5 font-semibold">
						{$_('globals.confirm')}
					</small>
				</button>
			</div>
		</div>
	</div>
{/if}
