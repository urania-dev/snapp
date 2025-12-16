<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';

	import HouseIcon from '@lucide/svelte/icons/house';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import {} from '$lib/remotes/config.remote';
	const sidebar = Sidebar.useSidebar();

	const { appname, host, logo }: { appname: string; host: THost; logo?: string } = $props();
	const homeURL = $derived(
		host?.options.disable.homepage
			? host.options.customRedirect || resolve('/dashboard')
			: resolve('/')
	);
</script>

<Sidebar.Header class="p-0">
	<Button
		class={[
			'group/button h-14 justify-start rounded-none border-b border-input bg-background py-0 text-muted-foreground hover:text-primary-foreground',
			sidebar.state !== 'collapsed' ? 'px-4!' : 'justify-center'
		]}
		href={homeURL}
	>
		{#if logo}
			<img src={logo} alt={appname} class="w-auto h-8 rounded object-contain" />
		{:else}
			<HouseIcon
				class="mx-0.5 size-5!  text-primary transition-all group-hover/button:text-primary-foreground"
				fill="currentColor"
				fill-opacity=".25"
			/>
		{/if}
		<span class={['font-bold text-lg', sidebar.state !== 'collapsed' ? '' : 'hidden']}
			>{appname}</span
		>
	</Button>
</Sidebar.Header>
