<script lang="ts">
	import { cn } from '$lib/svelte-sonner/internal';
	import type { MouseEventHandler } from 'svelte/elements';
	import Icon from './icon.svelte';

	let {
		name = 'switch',
		label,
		value = $bindable(false),
		icon,
		helper,
		idx,
		actions
	}: {
		label?: string;
		name?: string;
		value?: boolean;
		icon?: string;
		helper?: string;
		idx?: string;
		actions?: {
			toggle?: MouseEventHandler<HTMLElement>;
		};
	} = $props();
</script>

<div class="flex w-full flex-col items-center justify-center gap-2">
	<button
		class="flex w-full items-center justify-between gap-2"
		data-idx={idx}
		onclick={(e) => {
			actions?.toggle?.(e);
		}}
	>
		<input type="checkbox" {name} id={name} hidden bind:checked={value} />
		{#if label}
			<span class="flex w-full items-center gap-2 text-start text-sm font-semibold"
				>{#if icon}<Icon ph={icon}></Icon>{/if}
				{label}</span
			>
		{/if}
		<div
			class={cn(
				'flex h-6 w-14 cursor-pointer items-center rounded-full px-1 transition-all',
				value === true ? 'bg-green-500/20' : 'bg-pink-500/20'
			)}
		>
			<div
				class={cn(
					'flex h-3 w-3 rounded-full transition-all duration-500',
					value === true ? 'bg-green-500' : 'bg-pink-500',
					value === true ? 'ms-auto' : 'me-auto'
				)}
			></div>
		</div>
	</button>
	{#if helper}
		<small class="w-full text-start">{helper}</small>
	{/if}
</div>
