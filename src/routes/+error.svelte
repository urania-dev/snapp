<script>
	import { page } from '$app/state';
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import { _ } from 'svelte-i18n';
</script>

<div class="flex h-full w-full flex-col overflow-clip p-4 lg:h-full">
	<div class="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 overflow-clip lg:h-full">
		<div class="flex h-full w-full shrink-0 flex-col items-center justify-center">
			<Card css={{ card: 'w-full place-content-center max-w-md aspect-square grow-0 m-auto' }}>
				<h2 class="flex w-full items-center justify-center gap-2 text-center text-lg font-bold">
					<Icon ph="prohibit" style="bold" /><span>{@html $_('errors.label')}</span>
				</h2>
				<p class="mb-4 w-full text-balance text-center">{@html $_(page.error?.message || '')}</p>
				<div
					class="mx-auto mb-10 flex aspect-square h-56 w-56 items-center justify-center rounded-full bg-slate-500/25 p-10"
				>
					<Icon css={{ icon: 'text-pink-500/50' }} ph="link-break" size={128}></Icon>
				</div>
			</Card>
		</div>
	</div>
</div>
