<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import { outside } from '$lib/utils/outside';
	import { _ } from 'svelte-i18n';
	import { fade, fly } from 'svelte/transition';

	let show_confirm = $state(false);
	let sure = $state(false);
	const handle_export = async () => {
		const downloadLink = document.createElement('a');
		downloadLink.href = '/settings/export';
		downloadLink.download = `export.csv`;
		downloadLink.click();
		downloadLink.remove();
		sure = false;
	};
</script>

<Card css={{ card: 'gap-4' }}>
	<Card css={{ card: 'flex-row justify-between py-2 w-full' }}>
		<h4 class="text-lg font-semibold">{@html $_('migrations.label')}</h4>
		<span class="flex items-center">
			<Icon ph="crown" size={24}></Icon>
		</span>
	</Card>
	<div class="flex w-full flex-col gap-4 font-semibold md:flex-row">
		<a
			href="/settings/import"
			class="mt-auto flex h-10 w-full items-center justify-center gap-2 rounded bg-slate-500/25 px-4 text-sm transition-all hover:bg-slate-500/50"
		>
			<Icon ph="file-csv"></Icon><span>{@html $_('migrations.import-csv')}</span>
		</a>
		<button
			onclick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				show_confirm = true;
			}}
			class="mt-auto flex h-10 w-full items-center justify-center gap-2 rounded bg-slate-500/25 px-4 text-sm transition-all hover:bg-slate-500/50"
		>
			<Icon ph="file-csv"></Icon><span>{@html $_('migrations.export-csv')}</span>
		</button>
	</div>
</Card>

{#if show_confirm}
	<div class="fixed inset-0 z-[29] flex flex-col bg-neutral-950/50" transition:fade>
		<div
			use:outside={() => {
				show_confirm = false;
			}}
			class="z-30 m-auto flex w-full max-w-sm flex-col gap-4 overflow-y-scroll text-balance border border-slate-500/50 bg-neutral-50 p-4 leading-relaxed text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50"
			transition:fly={{ y: 25 }}
		>
			<h4>{@html $_('globals.sure-ask')}</h4>
			<p>{@html $_('migrations.requires-time')}</p>
			<div class="flex w-full gap-4">
				<button
					onclick={() => {
						show_confirm = false;
					}}
					class="flex h-8 w-full items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
					><small class="pt-0.5 font-semibold">
						{$_('globals.cancel')}
					</small>
				</button>
				<button
					data-idx="download"
					onclick={async () => {
						sure = true;
						show_confirm = false;
						await handle_export();
					}}
					class="flex h-8 w-full items-center justify-center gap-2 rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-green-500/50 focus:bg-green-500/50"
					><Icon ph="check" size={16} /><small class="pt-0.5 font-semibold">
						{$_('globals.confirm')}
					</small>
				</button>
			</div>
		</div>
	</div>
{/if}

{#if sure === true}
	<div
		class="fixed inset-0 z-[90] flex h-screen w-screen items-center justify-center bg-neutral-950/50"
		transition:fade
	>
		<div
			use:outside={() => {
				show_confirm = false;
			}}
			class="z-30 m-auto flex w-full max-w-sm items-center justify-center gap-4 overflow-y-scroll text-balance rounded border border-slate-500/50 bg-neutral-50 p-4 leading-relaxed text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50"
			transition:fly={{ y: 25 }}
		>
			<span>
				{$_('globals.loading')}
			</span>
			<span
				><Icon css={{ icon: 'animate-spin flex origin-center w-max h-max' }} ph="spinner"
				></Icon></span
			>
		</div>
	</div>
{/if}
