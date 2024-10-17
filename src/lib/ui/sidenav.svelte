<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import Icon from './icon.svelte';

	let { menu_items }: { menu_items: MenuItem[] } = $props();
</script>

<div
	class="fixed bottom-0 left-0 right-0 z-20 flex h-20 w-full bg-neutral-100 md:static md:h-full md:w-20 md:flex-col dark:bg-neutral-900"
>
	{#each menu_items as item}
		{#if item.visible}
			<a
				href={item.url}
				class={cn(
					'flex aspect-square h-20 md:shrink-0 w-full flex-col items-center justify-center gap-2 bg-slate-500/25 p-0 text-xxs font-bold uppercase outline-none transition-all hover:bg-slate-500/50 focus-visible:bg-slate-500/50 md:h-[unset] md:w-full lg:w-20',
					item.active === true ? 'bg-slate-500/100 text-neutral-50 hover:bg-slate-500 dark:bg-slate-600' : '',
					item.css
				)}
				data-sveltekit-preload-data
			>
				<Icon
					css={{ icon: cn('text-2xl w-max', item.active ? 'text-slate-100' : '') }}
					ph={item.icon}
					style={item.active ? 'fill' : 'regular'}
					size={24}
				></Icon>
				<span
					class="w-full text-center text-xxs {item.active ? 'text-slate-100 text-xxs' : 'text-xxs'}"
					>{item.label}</span
				>
			</a>
		{/if}
	{/each}
</div>
