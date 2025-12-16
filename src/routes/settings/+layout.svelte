<script lang="ts">
	import SettingSidebar from '$lib/components/blocks/sidebar/settings-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index';

	let { children, data } = $props();
</script>

<Sidebar.Provider class="h-full min-h-full w-full" open={false}>
	{@render children?.()}
	<SettingSidebar user={data.user} collapsible="icon" />
</Sidebar.Provider>
