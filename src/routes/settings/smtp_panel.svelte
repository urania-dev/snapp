<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import type { MouseEventHandler } from 'svelte/elements';
	import { _ } from 'svelte-i18n';
	import Input from '$lib/ui/input.svelte';
	import { SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER, SMTP_FROM } from '$lib/utils/constants';
	import type { User } from 'lucia';
	import { debounce } from '$lib/utils/debounce';
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
		smtp_status = $bindable(),
		save_this
	}: {
		smtp_host: string | undefined;
		smtp_port: string | undefined;
		smtp_user: string | undefined;
		smtp_pass: string | undefined;
		smtp_from: string | undefined;
		smtp_status: { active: boolean };
		save_this(field: keyof User | string, value: string, table?: string): void;
	} = $props();
</script>

<Card css={{ card: 'gap-4' }}>
	<Card css={{ card: 'flex-row justify-between py-2' }}>
		<h4 class="text-lg font-semibold">{@html $_('admin.labels.smtp')}</h4>
		<span class="flex items-center">
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
			<Card>
				<div class="relative flex w-full gap-3">
					<div class="absolute right-2 top-0.5 grid h-4 w-4 place-content-center">
						{#if smtp_status.active === true}
							<div title="Active" class="h-4 w-4 rounded-full bg-green-500"></div>
						{:else}
							<div title="Error" class="h-4 w-4 rounded-full bg-red-500"></div>
						{/if}
					</div>
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
	</div>
	<div class="flex h-full w-full flex-col gap-4 lg:flex-row">
		<div class="flex h-full w-full flex-col gap-4">
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
	</div>
	<div class="flex h-full w-full flex-col gap-4 lg:flex-row">
		<div class="flex h-full w-full flex-col gap-4">
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
		<div class="inline-flex h-full w-full flex-col gap-4">
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
	</div>
</Card>
