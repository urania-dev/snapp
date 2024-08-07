<script lang="ts">
	import type { FormEventHandler, MouseEventHandler } from 'svelte/elements';
	import Icon from './icon.svelte';
	import { cn } from '$lib/svelte-sonner/internal';
	import Input from './input.svelte';
	import { locales } from 'svelte-i18n';
	import { outside } from '$lib/utils/outside';

	let {
		name,
		label,
		icons,
		actions,
		items,
		css,
		value = $bindable(),
		disabled,
		locked = false,
		placeholder
	}: {
		name: string;
		label?: string;
		type?: (HTMLInputElement | HTMLTextAreaElement)['type'];
		disabled?: boolean;
		locked?: boolean;
		icons?: { left?: string; right?: string };
		actions?: {
			left?: MouseEventHandler<HTMLButtonElement>;
			right?: MouseEventHandler<HTMLButtonElement>;
			blur?: FormEventHandler<HTMLInputElement | HTMLTextAreaElement>;
			select: MouseEventHandler<HTMLButtonElement>;
			query?: FormEventHandler<HTMLInputElement | HTMLTextAreaElement>;
		};
		css?: { [key: string]: string };
		placeholder?: string;
		items: { value: string; id: string }[];
		value?: (HTMLInputElement | HTMLTextAreaElement)['value'] | null;
	} = $props();

	let element = $state<HTMLInputElement | HTMLTextAreaElement>();
	let show_panel = $state(false);

	const handle_select_panel: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.stopPropagation();
		show_panel = !show_panel;
		if (show_panel) element?.focus();
	};
</script>

<div
	class="relative flex w-full"
	use:outside={() => {
		if (show_panel) show_panel = false;
	}}
>
	<Input
		{label}
		css={{ input: 'capitalize' }}
		{placeholder}
		{name}
		{disabled}
		icons={{ ...icons, right: locked ? '' : show_panel ? 'caret-up' : 'caret-down' }}
		actions={{
			right: handle_select_panel,
			input: (e) => {
				e.stopPropagation();
				actions?.query?.(e);
			},
			focus: (e) => {
				e.stopPropagation();
				show_panel = true;
			}
		}}
		bind:element
		{value}
	/>
	{#if show_panel === true && locked === false}
		<div
			use:outside={() => (show_panel = false)}
			class={cn(
				'oveflow-clip absolute bottom-0 left-0 top-[calc(100%_+_0.5rem)] z-50 flex w-full flex-col overflow-y-scroll rounded border border-slate-500/50 bg-neutral-50 dark:bg-neutral-950',
				items.length === 1
					? 'h-10'
					: items.length === 2
						? 'h-20'
						: items.length === 3
							? 'h-32'
							: items.length > 3
								? 'h-36'
								: ''
			)}
		>
			{#each items as item}
				<button
					disabled={locked}
					data-idx={item.id}
					onclick={(e) => {
						e.stopPropagation();
						show_panel = false;
						actions?.select?.(e);
					}}
					class="flex min-h-10 w-full items-center border-none bg-neutral-50 px-4 text-sm font-semibold capitalize outline-none hover:bg-neutral-200 focus:bg-neutral-200 dark:bg-neutral-950 hover:dark:bg-neutral-700 focus:dark:bg-neutral-700"
				>
					{item.value}
				</button>
			{/each}
		</div>
	{/if}
</div>
