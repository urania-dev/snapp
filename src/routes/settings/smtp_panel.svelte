<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import type { MouseEventHandler } from 'svelte/elements';
	import { _ } from 'svelte-i18n';
	import Input from '$lib/ui/input.svelte';
	import Switch from '$lib/ui/switch.svelte';
	import {
		SMTP_HOST,
		SMTP_PASS,
		SMTP_PORT,
		SMTP_USER,
		SMTP_FROM,
		SMTP_SSL
	} from '$lib/utils/constants';
	import type { User } from 'lucia';
	import { debounce } from '$lib/utils/debounce';
	import { toast } from 'svelte-sonner';
	let show_smtp_pass = $state(false);
	let handle_show_smtp_pass: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.preventDefault();
		show_smtp_pass = !show_smtp_pass;
	};

	let {
		smtp_host = $bindable(),
		smtp_port = $bindable(),
		smtp_user = $bindable(),
		smtp_pass = $bindable(),
		smtp_from = $bindable(),
		smtp_ssl = $bindable(),
		smtp_status = $bindable(),
		save_this,
		fetch
	}: {
		smtp_host: string | undefined;
		smtp_port: string | undefined;
		smtp_user: string | undefined;
		smtp_pass: string | undefined;
		smtp_from: string | undefined;
		smtp_ssl: boolean | undefined;
		smtp_status: { active: boolean };
		save_this(...args: any): void;
		fetch: SvelteFetch;
	} = $props();

	let test_sent = $state(false);
</script>

<Card css={{ card: 'gap-4' }}>
	<Card css={{ card: 'flex-row justify-between py-2' }}>
		<h4 class="text-lg font-semibold">{@html $_('admin.labels.smtp')}</h4>
		<span class="flex items-center gap-4">
			{#if smtp_status.active === true}
				<div title="Active" class="h-4 w-4 rounded-full bg-green-500"></div>
			{:else}
				<div title="Error" class="h-4 w-4 rounded-full bg-red-500"></div>
			{/if}
			<Icon ph="crown" size={24}></Icon>
		</span>
	</Card>

	<div class="flex h-full w-full flex-col gap-4 lg:flex-row">
		<div class="flex h-full w-full flex-col gap-4">
			<Card css={{ card: 'h-full items-center flex-row' }}>
				<small class="w-full text-balance leading-relaxed">{@html $_('admin.helpers.smtp')}</small>
			</Card>
		</div>
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card css={{ card: 'h-full' }}>
				<Switch
					bind:value={smtp_ssl}
					label={'SSL'}
					helper={$_('admin.helpers.smtp-ssl')}
					idx={SMTP_SSL}
					actions={{
						toggle: (e) => {
							const field = e.currentTarget.dataset.idx;
							if (field) save_this(field, String(!smtp_ssl), 'settings');
						}
					}}
				></Switch>
			</Card>
		</div>
	</div>
	<div class="flex h-full w-full flex-col gap-4 lg:flex-row">
		<div class="flex h-full w-full flex-col gap-4">
			<Card>
				<div class="relative flex w-full gap-3">
					<Input
						css={{
							label: 'inline-flex w-max',
							input: 'text-sm'
						}}
						icons={{ left: 'hard-drives' }}
						actions={{
							change: (e) => {
								e.preventDefault();
								save_this(SMTP_HOST, e.currentTarget.value, 'settings');
							},
							input: (e) => {
								const element = e.currentTarget;
								debounce(() => {
									element.blur();
								}, 1000)();
							}
						}}
						type="text"
						bind:value={smtp_host}
						name={SMTP_HOST}
						label={$_('admin.labels.smtp-host')}
					/>
				</div>
			</Card>
		</div>
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card>
				<Input
					css={{
						label: 'inline-flex w-max',
						input: 'text-sm'
					}}
					icons={{ left: 'plug' }}
					actions={{
						change: (e) => {
							e.preventDefault();
							save_this(SMTP_PORT, e.currentTarget.value, 'settings');
						},
						input: (e) => {
							const element = e.currentTarget;
							debounce(() => {
								element.blur();
							}, 1000)();
						}
					}}
					type="text"
					bind:value={smtp_port}
					name={SMTP_PORT}
					label={$_('admin.labels.smtp-port')}
				/>
			</Card>
		</div>
	</div>
	<div class="flex h-full w-full flex-col gap-4 lg:flex-row">
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card>
				<Input
					css={{
						label: 'inline-flex w-max',
						input: 'text-sm'
					}}
					icons={{ left: 'user' }}
					actions={{
						change: (e) => {
							e.preventDefault();
							save_this(SMTP_USER, e.currentTarget.value, 'settings');
						},
						input: (e) => {
							const element = e.currentTarget;
							debounce(() => {
								element.blur();
							}, 1000)();
						}
					}}
					type="text"
					bind:value={smtp_user}
					name={SMTP_USER}
					label={$_('admin.labels.smtp-user')}
				/>
			</Card>
		</div>

		<Card>
			<Input
				css={{
					label: 'inline-flex w-max',
					input: 'text-sm'
				}}
				icons={{
					left: 'key',
					right: show_smtp_pass === true ? 'eye' : 'eye-closed'
				}}
				actions={{
					right: handle_show_smtp_pass,
					change: (e) => {
						e.preventDefault();
						save_this(SMTP_PASS, e.currentTarget.value, 'settings');
					},
					input: (e) => {
						const element = e.currentTarget;
						debounce(() => {
							element.blur();
						}, 1000)();
					}
				}}
				type={show_smtp_pass ? 'text' : 'password'}
				bind:value={smtp_pass}
				name={SMTP_PASS}
				label={$_('admin.labels.smtp-pass')}
			/>
		</Card>
	</div>
	<div class="inline-flex h-full w-full gap-4">
		<div class="flex h-full w-full flex-col gap-4">
			<Card>
				<Input
					css={{
						label: 'inline-flex w-max',
						input: 'text-sm'
					}}
					icons={{ left: 'envelope' }}
					actions={{
						change: (e) => {
							e.preventDefault();
							save_this(SMTP_FROM, e.currentTarget.value, 'settings');
						},
						input: (e) => {
							const element = e.currentTarget;
							debounce(() => {
								element.blur();
							}, 1000)();
						}
					}}
					type="text"
					bind:value={smtp_from}
					name={SMTP_FROM}
					label={$_('admin.labels.smtp-from')}
				/>
			</Card>
		</div>
		<div class="flex h-full w-full flex-col gap-4">
			<Card css={{ card: 'h-full' }}>
				<button
					disabled={!smtp_status || test_sent}
					onclick={async () => {
						try {
							const res = await (
								await fetch('/api/utils/smtp-send-test', { credentials: 'include' })
							).json();
							smtp_status = res;
						} catch (error) {
							console.log(error);
						}
						toast.info($_('users.auth.post-email-message'));
					}}
					class="mt-auto justify-between font-semibold flex h-10 w-full items-center gap-2 rounded bg-slate-500/25 px-4 text-sm transition-all hover:bg-slate-500/50"
				>
					<span>{$_('admin.labels.smtp-test')}</span>
					<Icon ph="envelope" />
				</button>
				<span class="text-xs">{$_('admin.helpers.smtp-test')}</span>
			</Card>
		</div>
	</div>
</Card>
