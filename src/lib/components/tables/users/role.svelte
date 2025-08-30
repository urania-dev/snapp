<script lang="ts">
	import Badge from "$lib/components/ui/badge/badge.svelte";

	const { role }: { role: string } = $props();
</script>

<div class="flex w-full flex-wrap justify-center gap-1 px-2">
	<Badge
		class="cursor-default text-[10px] font-bold uppercase {role === 'admin'
			? 'bg-amber-500 hover:bg-amber-500'
			: role === 'root'
				? 'bg-[rebeccapurple] text-white hover:bg-[rebeccapurple]'
				: ''}">{role}</Badge
	>
</div>
