<script lang="ts">
	import { toast } from 'svelte-sonner';
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import { cn } from '$lib/utils/cn';
	import { _ } from 'svelte-i18n';
	import papa from 'papaparse';
	import { intlFormatDistance } from 'date-fns';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types.js';
	import { goto, invalidateAll } from '$app/navigation';
	let { data, form } = $props();

	let import_list = $state<Partial<Snapp>[]>([]);
	let files = $state<FileList>();

	$effect(() => {
		if (files?.length) {
			handle_csv();
		}
	});

	async function handle_csv() {
		const file = files?.[0];
		if (!file) return;

		const ext = file.name.endsWith('.csv');
		if (!ext) {
			toast.error($_('migrations.csv-file-required'));
			files = undefined;
			return;
		}

		const old_snapps = await papa.parse<{
			id: string;
			user_id: string;
			created: Date;
			original_url: string;
			has_secret: boolean;
			shortcode: string;
			notes: string;
			used: number;
		}>(await file.text(), {
			delimiter: ',',
			header: true,
			dynamicTyping: true
		});

		if (old_snapps.data.length)
			import_list = old_snapps.data
				.filter((snapp) => snapp.original_url && snapp.original_url?.trim() !== '')
				.map((snapp) => ({
					userId: data.user.id,
					shortcode: snapp.shortcode,
					original_url: snapp.original_url,
					created: snapp.created,
					notes: snapp.notes,
					hit: snapp.used
				}));
	}

	function getRelativeDate(date: Date) {
		const rel = intlFormatDistance(date, new Date(), { locale: data.lang });
		return rel;
	}

	const enhanceSubmit: SubmitFunction = ({ formData, cancel }) => {
		if (!import_list.length) return cancel();
		formData.set('snapps', JSON.stringify(import_list));

		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
			if (form?.success) {
				import_list = [];
				await goto('/dashboard', { invalidateAll: true });
			}
		};
	};
</script>

<form method="post" id="import" use:enhance={enhanceSubmit} hidden></form>
<input hidden type="file" id="csv" name="file" multiple={false} bind:files />
<div class={cn('flex h-full w-full flex-col p-4 pb-8')}>
	<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 overflow-hidden">
		<a class="flex gap-2 font-semibold uppercase tracking-wider" href="/settings"
			><Icon ph="arrow-left" /><small class="text-sm">{$_('globals.back')}</small></a
		>
		<div class="flex w-full items-center justify-between">
			<h4 class="text-lg font-bold leading-relaxed tracking-wide">
				{$_(`migrations.import-csv`)}
			</h4>
			<button
				onclick={() => {
					document.getElementById('csv')?.click();
				}}
				class="flex h-10 max-w-max items-center justify-center gap-2 rounded bg-slate-500/25 px-4 text-sm font-semibold transition-all hover:bg-slate-500/50"
				><Icon ph="file-arrow-up"></Icon>
				<span>
					{$_('migrations.upload')}
				</span>
			</button>
		</div>
		<Card css={{ card: 'gap-4 overflow-hidden h-full' }}>
			<Card css={{ card: 'p-4 items-center h-[calc(100%_-_5rem)] justify-center gap-4' }}>
				{#if !import_list.length}
					<div class="flex h-full w-full shrink-0 flex-col items-center justify-center">
						<div class="flex rounded-full bg-slate-500/25 p-10">
							<Icon css={{ icon: 'text-pink-500/50' }} ph="magnifying-glass" size={128}></Icon>
						</div>
					</div>
				{:else}
					<div class="flex h-full w-full flex-col gap-2 overflow-y-scroll pe-2">
						{#each import_list as item}
							<Card css={{ card: 'flex-row w-full gap-4 justify-between items-start' }}>
								<small class="w-full max-w-20 overflow-hidden text-ellipsis text-sm">
									{item.shortcode}
								</small>
								<small
									class="whitespace-wrap hidden w-full max-w-sm shrink-0 overflow-hidden text-ellipsis text-sm md:flex"
								>
									{item.original_url}
								</small>
								<small
									class="w-full max-w-20 shrink-0 text-ellipsis whitespace-nowrap text-end text-sm"
								>
									{#if item.created}{getRelativeDate(new Date(item.created))}{/if}
								</small>
							</Card>
						{/each}
					</div>
				{/if}
			</Card>
			<Card css={{ card: 'h-16 shrink-0 p-0 px-4 items-center flex-row' }}>
				<button
					disabled={!import_list.length}
					onclick={() => {
						document.forms.namedItem('import')?.requestSubmit();
					}}
					class="ms-auto flex h-10 max-w-max items-center justify-center gap-2 rounded bg-slate-500/25 px-4 text-sm font-semibold transition-all hover:bg-slate-500/50 disabled:opacity-50"
				>
					<span>{$_('globals.continue')}</span>
					<Icon ph="arrow-right"></Icon>
				</button>
			</Card>
		</Card>
	</div>
</div>
