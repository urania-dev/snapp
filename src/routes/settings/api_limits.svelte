<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import Input from '$lib/ui/input.svelte';
	import {
		MAX_REQUESTS_PER_MINUTE,
		MAX_REQUESTS_PER_DAY,
		MAX_SNAPPS_PER_USER
	} from '$lib/utils/constants';
	import { debounce } from '$lib/utils/debounce';
	import type { Setting } from '@prisma/client';
	import type { User } from 'lucia';
	import { _ } from 'svelte-i18n';

	let {
		rpd = $bindable(),
		rpm = $bindable(),
		spu = $bindable(),

		save_this
	}: {
		save_this(field: keyof User | keyof Setting | string, value: string, table?: string): void;
		rpd: number;
		rpm: number;
		spu: number;
	} = $props();
</script>

<Card css={{ card: 'gap-4' }}>
	<Card css={{ card: 'flex-row justify-between py-2' }}>
		<h4 class="text-lg font-semibold">{@html $_('admin.labels.limits')}</h4>
		<span class="flex items-center">
			<Icon ph="crown" size={24}></Icon>
		</span>
	</Card>
	<div class="flex w-full flex-col gap-4 lg:flex-row">
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card css={{card:'h-full'}}>
				<Input
					css={{
						label: 'inline-flex w-max',
						group: 'font-mono',
						input: 'text-sm text-end'
					}}
					icons={{ left: 'lightning' }}
					actions={{
						change: (e) => {
							e.preventDefault();
							save_this(MAX_REQUESTS_PER_DAY, e.currentTarget.value, 'settings');
						},
						input: (e) => {
							const element = e.currentTarget;
							debounce(() => {
								element.blur();
							}, 1000)();
						}
					}}
					type="number"
					bind:value={rpd}
					name={MAX_REQUESTS_PER_DAY}
					label={$_('admin.labels.rpd')}
				/>
				<small class="w-full">{@html $_('admin.helpers.rpd')}</small>
			</Card>
		</div>
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card css={{card:'h-full'}}>
				<Input
					css={{
						group: 'font-mono',
						input: 'text-sm text-end'
					}}
					icons={{ left: 'lightning' }}
					actions={{
						change: (e) => {
							e.preventDefault();
							save_this(MAX_REQUESTS_PER_MINUTE, e.currentTarget.value, 'settings');
						},
						input: (e) => {
							const element = e.currentTarget;
							debounce(() => {
								element.blur();
							}, 1000)();
						}
					}}
					type="number"
					bind:value={rpm}
					name={MAX_REQUESTS_PER_MINUTE}
					label={$_('admin.labels.rpm')}
				/>
				<small class="w-full">{@html $_('admin.helpers.rpm')}</small>
			</Card>
		</div>
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card css={{card:'h-full'}}>
				<Input
					css={{
						group: 'font-mono',
						input: 'text-sm text-end'
					}}
					icons={{ left: 'link' }}
					actions={{
						change: (e) => {
							e.preventDefault();
							save_this(MAX_SNAPPS_PER_USER, e.currentTarget.value, 'settings');
						},
						input: (e) => {
							const element = e.currentTarget;
							debounce(() => {
								element.blur();
							}, 1000)();
						}
					}}
					type="number"
					bind:value={spu}
					name={MAX_SNAPPS_PER_USER}
					label={$_('admin.labels.spu')}
				/>
				<small class="w-full">{@html $_('admin.helpers.spu')}</small>
			</Card>
		</div>
	</div>
</Card>
