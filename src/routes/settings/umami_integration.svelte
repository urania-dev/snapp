<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import Input from '$lib/ui/input.svelte';
	import { UMAMI_URL, UMAMI_WEBSITE_ID } from '$lib/utils/constants';
	import { debounce } from '$lib/utils/debounce';
	import { _ } from 'svelte-i18n';
	let {
		is_admin = $bindable(),
		role = $bindable(),
		umami_website_id,
		umami_url,
		save_this
	}: {
		is_admin: boolean;
		umami_website_id?: string;
		umami_url?: string;
		role: 'root' | 'user' | 'admin';
		save_this(field: keyof User | keyof Setting | string, value: string, table?: string): void;
	} = $props();
</script>

<Card css={{ card: 'gap-4' }}>
	<div class="flex w-full gap-4">
		<Card css={{ card: 'flex flex-row items-center justify-between py-2' }}>
			<h4 class="text-lg font-semibold">{$_('homepage.features.umami.label')}</h4>
			{#if is_admin === true}
				<span class="flex items-center">
					<span class="pe-2 pt-0.5 text-xs font-bold uppercase tracking-wider">
						{role}
					</span>
					<Icon ph="crown" size={24}></Icon>
				</span>
			{/if}
		</Card>
	</div>
	<div class="flex h-full w-full flex-col gap-4 lg:flex-row">
		<div class="flex h-full w-full flex-col gap-4">
			<div class="flex flex-col w-full gap-4">
				<Card css={{ card: 'h-full items-center flex-row w-full max-w-none' }}>
					<small class="w-full text-balance leading-relaxed"
						>{@html $_('homepage.features.umami.description')}</small
					>
				</Card>
			</div>
			<div class="flex lg:flex-row flex-col w-full gap-4">
				<Card css={{ card: 'h-full items-center flex-row' }}>
					<Input
						css={{
							label: 'inline-flex w-max',
							input: 'text-sm'
						}}
						icons={{ left: 'link' }}
						actions={{
							change: (e) => {
								e.preventDefault();
								save_this(UMAMI_URL, e.currentTarget.value, 'settings');
							},
							input: (e) => {
								const element = e.currentTarget;
								debounce(() => {
									element.blur();
								}, 1000)();
							}
						}}
						type="text"
						value={umami_url}
						name={UMAMI_URL}
						label="Umami URL"
					/>
				</Card>
				<Card css={{ card: 'h-full items-center w-full max-w-none flex-row' }}>
					<Input
						css={{
							label: 'inline-flex w-max',
							input: 'text-sm'
						}}
						icons={{ left: 'hash' }}
						actions={{
							change: (e) => {
								e.preventDefault();
								save_this(UMAMI_WEBSITE_ID, e.currentTarget.value, 'settings');
							},
							input: (e) => {
								const element = e.currentTarget;
								debounce(() => {
									element.blur();
								}, 1000)();
							}
						}}
						type="text"
						value={umami_website_id}
						name={UMAMI_WEBSITE_ID}
						label="Umami Website ID"
					/>
				</Card>
			</div>
		</div>
	</div>
</Card>
