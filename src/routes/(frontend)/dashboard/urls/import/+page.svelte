<script lang="ts">
	import { getLocale } from '$lib/i18n';
	import LinkIcon from 'lucide-svelte/icons/link';
	import UploadFileIcon from 'lucide-svelte/icons/file-up';
	import Papa from 'papaparse';
	import ImportIcon from 'lucide-svelte/icons/blocks';

	import Breadcrumbs from '$lib/ui/crumbs/breadcrumbs.svelte';
	import { H3, Lead, Paragraph, Small } from '$lib/ui/typography';
	import { FileDropzone } from '@skeletonlabs/skeleton';
	import { toast } from 'svelte-sonner';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';

	import ImportedRow from '$lib/ui/row/imported-row.svelte';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types';
	import { invalidateAll } from '$app/navigation';

	export let data, form;
	let files: FileList | undefined;
	const { t } = getLocale();

	$: if (files && files.length !== 0) {
		const csv = files[0];
		const ext = csv.name.endsWith('.csv');
		if (!ext) {
			toast.custom(CustomToast, {
				componentProps: {
					message: 'snapps:import:error:extension',
					state: 'warning'
				}
			});
		} else handle_csv(csv);
	}

	let imported_snapps: Partial<DBSnapp>[] = [];

	let main_author = data.user.id;
	type OldSnapp = {
		id: string;
		original_url: string;
		short_code: string;
		created_at: string;
		expires_at: string;
		secret: string;
		has_secret: boolean;
		user_id: string;
	};
	async function handle_csv(csv: File) {
		try {
			const rows = Papa.parse<OldSnapp>(await csv.text(), {
				delimiter: ',',
				header: true,
				dynamicTyping: true
			});

			rows.data.map((snapp) => {
				console.log({ snapp });
				const _snapp = {
					id: snapp.id,
					created: new Date(snapp.created_at),
					user_id: data.user.id,
					shortcode: snapp.short_code,
					has_secret: snapp.has_secret,
					secret: snapp.secret,
					original_url: snapp.original_url
				};

				imported_snapps = [...imported_snapps, _snapp];
			});
		} catch (error) {
			toast.custom(CustomToast, {
				componentProps: {
					message: 'snapps:import:error',
					state: 'warning'
				}
			});
			console.log(error);

			imported_snapps = [];
			files = undefined;
		}
	}

	function handle_author(this: HTMLSelectElement) {
		const id = this.dataset.idx;
		if (id === 'main') {
			imported_snapps = imported_snapps.map((snapp) => {
				snapp.user_id = main_author;
				return snapp;
			});
		} else {
			imported_snapps = imported_snapps.map((snapp) => {
				if (snapp.id === id) snapp.user_id = this.value;
				return snapp;
			});
		}
	}

	let loading = false;

	const enhanceImport: SubmitFunction = function ({ formData }) {
		formData.set('snapps', JSON.stringify(imported_snapps));
		loading = true;
		return async function ({ result }) {
			await applyAction(result);

			if (result.status === 200 && form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form?.message,
						state: 'success'
					}
				});
			else if (form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form?.message,
						state: 'error'
					}
				});
			await invalidateAll();
			loading = false;
            imported_snapps = [];
            files=undefined
		};
	};

	function handle_submit() {
		document.forms.namedItem('import')?.requestSubmit();
	}
</script>
<svelte:head><title>{$t('global:appname')} | {$t('snapps:import')}</title></svelte:head>

<form method="post" use:enhance={enhanceImport} id="import" />
<div class="page h-full flex">
	<div class="flex max-h-max">
		<div class="flex flex-col gap-4">
			<Breadcrumbs
				urls={[
					{ label: $t('global:pages:dashboard'), href: '/dashboard' },
					{ label: $t('snapps:import') }
				]}
			/>
			<div class="flex gap-2 items-center">
				<LinkIcon class="w-6 h-6" />
				<H3 class="mb-1 w-max">
					{$t('global:sections:import')}
				</H3>
			</div>
		</div>
	</div>
	<div class="card w-full h-full flex flex-col">
		{#if imported_snapps.length === 0}
			<div class="card-header">
				<Lead>{$t('snapps:import:label')}</Lead>
			</div>
			<div class="card-body p-4 h-full flex">
				<FileDropzone name="files" bind:files class="h-full">
					<svelte:fragment slot="lead"><UploadFileIcon class="w-8 h-8 mx-auto" /></svelte:fragment>
					<svelte:fragment slot="message">
						<Small class="font-semibold">{$t('snapps:import:helper')}</Small>
					</svelte:fragment>
				</FileDropzone>
			</div>
		{:else}
			<div class="card-header flex justify-between">
				<Lead>{$t('snapps:import:label:assign')}</Lead>
				<div class="flex ms-auto">
					<select
						class="select inline-flex max-w-max variant-glass-secondary h-8 leading-none text-sm font-semibold"
						bind:value={main_author}
						on:change={handle_author}
						data-idx="main"
					>
						<option value={data.user.id} class="rounded-none">{data.user.username}</option>
						{#each data.users as user}
							<option value={user.id} class="rounded-none">{user.username}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="card-body p-4 h-[calc(100dvh_-_208px)] flex overflow-hidden overflow-y-scroll">
				<div class="table-container rounded-none">
					<!-- Native Table Element -->
					<table class="table table-hover variant-glass rounded-none">
						<thead class="align-middle max-h-12 overflow-hidden">
							<tr>
								<th style:padding-inline=".5rem" style:padding-block="0">
									<Paragraph class="font-semibold leading-none table-header">
										{$t('snapps:columns:original:url')}
									</Paragraph>
								</th>
								<th style:padding-inline=".5rem" style:padding-block="0">
									<Paragraph class="font-semibold leading-none table-header">
										{$t('snapps:columns:shortcode')}
									</Paragraph>
								</th>
								<th style:padding-inline=".5rem" style:padding-block="0">
									<Paragraph class="font-semibold leading-none table-header">
										{$t('snapps:columns:has:secret')}
									</Paragraph>
								</th>
								<th style:padding-inline=".5rem" style:padding-block="0">
									<Paragraph class="font-semibold leading-none table-header">
										{$t('snapps:columns:created')}
									</Paragraph>
								</th>
								<th class="text-end">
									<Paragraph class="font-semibold leading-none table-header pe-2">
										{$t('snapps:columns:author')}
									</Paragraph>
								</th>
							</tr>
						</thead>
						<tbody>
							{#each imported_snapps as row, i}
								<ImportedRow
									locale={data.lang}
									{row}
									{handle_author}
									user={data.user}
									users={data.users}
								/>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="card-footer flex justify-end">
				<button
					class="btn variant-glass-primary hover:variant-filled-primary ms-auto"
					on:click={handle_submit}
				>
					<ImportIcon class="h-4 w-4" />
					<Small class="font-semibold">
						{$t('snapps:import')}
					</Small>
				</button>
			</div>
		{/if}
	</div>
</div>
