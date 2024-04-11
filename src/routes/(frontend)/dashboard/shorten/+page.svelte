<script lang="ts">
	import LinkIcon from 'lucide-svelte/icons/link';
	import GlobeIcon from 'lucide-svelte/icons/globe';
	import { applyAction, enhance } from '$app/forms';
	import Breadcrumbs from '$lib/ui/crumbs/breadcrumbs.svelte';
	import { getLocale } from '$lib/i18n';
	import { H3, Lead, Paragraph, Small } from '$lib/ui/typography';
	import PlusIcon from 'lucide-svelte/icons/plus-circle';
	import SaveIcon from 'lucide-svelte/icons/save';
	import MousePointerClickIcon from 'lucide-svelte/icons/mouse-pointer-click';
	import EyeOffIcon from 'lucide-svelte/icons/eye-off';
	import EyeIcon from 'lucide-svelte/icons/eye';
	import SparkleIcon from 'lucide-svelte/icons/sparkles';
	import AlarmIcon from 'lucide-svelte/icons/alarm-clock';
	import KeyIcon from 'lucide-svelte/icons/key-square';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { today, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import { slugify } from '$lib/utils/slugify/index.js';
	import { generateRandomString } from '$lib/utils/randomString/index.js';
	import type { SubmitFunction } from './$types.js';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';

	export let data, form;

	let original_url: string;
	let shortcode: string;
	let max_usages: number;
	let secret: string;
	let show_secret = false;

	function handle_show_secret() {
		show_secret = !show_secret;
	}

	const { t } = getLocale();

	function handle_enter_submit(this: HTMLButtonElement, event: Event) {
		const keyEvent = event as KeyboardEvent;
		if (keyEvent.code !== 'Enter' && keyEvent.code !== 'NumpadEnter') return;
		document.forms.namedItem('shorten')?.requestSubmit();
	}

	function handle_submit() {
		document.forms.namedItem('shorten')?.requestSubmit();
	}

	let enable_ttl = false;
	let enable_max_usages = false;
	let enable_secret = false;

	function handle_enable_ttl() {
		if (!enable_ttl) date_picker_value = undefined;
	}
	function generate_shortcode() {
		shortcode = slugify(generateRandomString(6));
	}

	function handle_slugify(this: HTMLInputElement) {
		shortcode = slugify(this.value);
	}

	let date_picker_value: DateValue | undefined = today(getLocalTimeZone());
	let ttl: number = Math.abs(
		new Date(new Date(date_picker_value.toString()).getTime() - new Date().getTime()).getTime()
	);

	function handle_change_date() {
		if (date_picker_value) {
			const _ttl = Math.abs(
				new Date(new Date(date_picker_value.toString()).getTime() - new Date().getTime()).getTime()
			);
			ttl = _ttl;
		}
	}
	let notes: string;

	const httpsRegexp = new RegExp(/^https:\/\/[^\s/$.?#].[^\s]*$/);

	function valid_original_url(this: HTMLInputElement) {
		if (!original_url || original_url === undefined || original_url.trim() === '') {
			is_invalid_url = false;
			is_valid_url = false;
		} else {
			if (data.allow_unsecure_http) {
				is_valid_url = true;
				is_invalid_url = false;
				return;
			}
			is_valid_url = httpsRegexp.test(original_url);
			is_invalid_url = !is_valid_url;
		}
	}

	const enhanceShorten: SubmitFunction = function ({ formData, cancel }) {
		if (original_url) formData.set('original_url', original_url);
		else {
			is_invalid_url = true;
			return cancel();
		}
		if (shortcode) formData.set('shortcode', shortcode);

		if (enable_ttl && ttl) formData.set('ttl', String(ttl));

		if (secret) formData.set('secret', secret);
		if (max_usages) formData.set('max_usages', String(max_usages));
		if (notes) formData.set('notes', notes);
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
			if (result.status === 200) await goto('/dashboard');
		};
	};

	function show_picker(this: HTMLInputElement) {
		this.showPicker();
	}

	let is_invalid_url = false;
	let is_valid_url = false;
</script>

<svelte:head><title>{$t('global:appname')} | {$t('global:pages:shorten')}</title></svelte:head>

<form id="shorten" method="post" action="?/shorten" use:enhance={enhanceShorten} />
<div class="page">
	<Breadcrumbs
		urls={[
			{ label: $t('global:pages:dashboard'), href: '/dashboard' },
			{ label: $t('global:pages:shorten') }
		]}
	/>
	<div class="flex gap-2 items-center">
		<PlusIcon class="w-6 h-6" />
		<H3 class="mb-1 w-max">
			{$t('global:sections:shorten')}
		</H3>
	</div>
	<div class="grid lg:grid-cols-2 gap-4">
		<div class="flex flex-col gap-4">
			<div class="card w-full">
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('global:sections:shorten:header')}</Lead>
				</div>
				<div class="card-body px-4 pb-4 flex flex-col gap-4">
					<label for="original_url" class="flex flex-col gap-1">
						<Paragraph class="font-semibold">{$t('snapps:original:url:label')}</Paragraph>
						<div
							class="input-group input-group-divider grid-cols-[auto_1fr_auto]"
							class:variant-glass-success={is_valid_url}
							class:variant-glass-error={is_invalid_url}
						>
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<GlobeIcon strokeWidth="1.5" class="w-5 h-5" />
							</div>
							<input
								class="input rounded-none"
								id="original_url"
								on:keydown={handle_enter_submit}
								on:keydown={valid_original_url}
								type="text"
								name="original_url"
								class:variant-glass-success={is_valid_url}
								class:variant-glass-error={is_invalid_url}
								placeholder={$t('snapps:original:url:description')}
								bind:value={original_url}
							/>
						</div>
						<Small class="mt-1"
							>{#if data.allow_unsecure_http === false}{@html $t('snapps:original:url:helper')}{/if}</Small
						>
					</label>
					<label for="shortcode" class="flex flex-col gap-1">
						<Paragraph class="font-semibold">{$t('snapps:shortcode:label')}</Paragraph>
						<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<LinkIcon strokeWidth="1.5" class="w-5 h-5" />
							</div>
							<input
								class="input rounded-none"
								id="shortcode"
								on:keydown={handle_enter_submit}
								on:keydown={handle_slugify}
								type="text"
								name="shortcode"
								placeholder={$t('snapps:shortcode:description')}
								bind:value={shortcode}
							/>
							<button
								class="flex items-center w-10"
								style:padding="0"
								style:justify-content="center"
								on:click={generate_shortcode}
								tabindex="-1"
							>
								<SparkleIcon strokeWidth="1.5" class="w-5 h-5" />
							</button>
						</div>
						<Small class="mt-1">{@html $t('snapps:shortcode:helper')}</Small>
					</label>
				</div>
			</div>
			<div
				class="card w-full
					 flex flex-col flex-grow"
			>
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('snapps:notes:label')}</Lead>
				</div>
				<div class="card-body full flex-grow hide-scrollbar flex gap-4 ps-[1px] pe-[1px] pb-[1px]">
					<textarea
						name="notes"
						class="textarea border-r-0 border-l-0 border-b-0 rounded-tl-none rounded-tr-none min-h-40"
						bind:value={notes}
					/>
				</div>
			</div>
		</div>
		<div class="flex flex-col gap-4">
			<div class="card w-full">
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('snapps:sections:advanced:usages')}</Lead>
					<div class="flex items-center justify-end scale-[.8]">
						<SlideToggle
							size="sm"
							id="enable-usages"
							name="enable_usages"
							background="bg-surface-300-600-token"
							active="bg-success-300-600-token"
							bind:checked={enable_max_usages}
						/>
					</div>
				</div>
				<div class="card-body px-4 pb-4 flex flex-col gap-4">
					<label for="max_usages" class="flex flex-col gap-4 w-full">
						<Paragraph>{$t('snapps:sections:advanced:usages:description')}</Paragraph>
						<div
							class="input-group h-10 sm:mt-0 mt-1 flex-grow-0 max-w-40 me-auto input-group-divider grid-cols-[auto_1fr_auto]"
						>
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<MousePointerClickIcon strokeWidth="1.5" class="w-5 h-5" />
							</div>
							<input
								class="input rounded-none text-right flex flex-grow-0 disabled:opacity-50"
								on:keydown={handle_enter_submit}
								id="max_usages"
								type="text"
								disabled={!enable_max_usages}
								name="max_usages"
								placeholder={$t('settings:app:user:limits:max:placeholder')}
								bind:value={max_usages}
							/>
						</div>
					</label>
				</div>
			</div>

			<!-- EXPIRATION -->
			<div class="card w-full">
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('snapps:sections:advanced:ttl')}</Lead>
					<div class="flex items-center justify-end scale-[.8]">
						<SlideToggle
							size="sm"
							id="enable-ttl"
							name="enable_ttl"
							background="bg-surface-300-600-token"
							active="bg-success-300-600-token"
							bind:checked={enable_ttl}
							on:change={handle_enable_ttl}
						/>
					</div>
				</div>
				<div class="card-body px-4 pb-4 flex flex-col gap-4">
					<label for="ttl" class="flex flex-col gap-1 w-full">
						<Paragraph class="max-w-sm"
							>{@html $t('snapps:sections:advanced:ttl:description')}</Paragraph
						>
						<div
							class="input-group h-10 mt-4 flex-grow-0 max-w-40 me-auto input-group-divider grid-cols-[1fr]"
						>
							<input
								type="date"
								class="input rounded-none w-full text-sm"
								bind:value={date_picker_value}
								on:click={show_picker}
								on:change={handle_change_date}
							/>
						</div>
					</label>
				</div>
			</div>
			<div class="card w-full">
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('snapps:sections:advanced:secret')}</Lead>
					<div class="flex items-center justify-end scale-[.8]">
						<SlideToggle
							size="sm"
							id="enable-ttl"
							name="enable_ttl"
							background="bg-surface-300-600-token"
							active="bg-success-300-600-token"
							bind:checked={enable_secret}
						/>
					</div>
				</div>
				<div class="card-body px-4 pb-4 flex flex-col gap-4">
					<label for="secret" class="flex flex-col gap-1 items-start w-full">
						<Paragraph class="max-w-sm"
							>{@html $t('snapps:sections:advanced:secret:description')}</Paragraph
						>
						<div
							class="input-group h-10 mt-2 flex-grow-0input-group-divider grid-cols-[auto_1fr_auto]"
						>
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<KeyIcon strokeWidth="1.5" class="w-5 h-5" />
							</div>
							{#if show_secret}
								<input
									class="input rounded-none text-left flex flex-grow-0 disabled:opacity-50"
									on:keydown={handle_enter_submit}
									id="secret"
									type="text"
									disabled={!enable_secret}
									name="secret"
									placeholder={$t('snapps:sections:advanced:secret:placeholder')}
									bind:value={secret}
								/>
							{:else}
								<input
									class="input rounded-none text-left flex flex-grow-0 disabled:opacity-50"
									on:keydown={handle_enter_submit}
									id="secret"
									type="password"
									disabled={!enable_secret}
									name="secret"
									placeholder={$t('snapps:sections:advanced:secret:placeholder')}
									bind:value={secret}
								/>
							{/if}
							<button
								class="flex items-center w-10"
								style:padding="0"
								style:justify-content="center"
								on:click={handle_show_secret}
								disabled={!enable_secret}
							>
								{#if show_secret}
									<EyeOffIcon strokeWidth="1.5" class="w-5 h-5" />
								{:else}
									<EyeIcon strokeWidth="1.5" class="w-5 h-5" />
								{/if}
							</button>
						</div>
					</label>
				</div>
			</div>
		</div>
	</div>
	<div class="flex card p-4">
		{#if !data.isAdmin}
			<Small class="self-center font-semibold"
				>{@html $t('snapps:limit', { count: data.existing, max: data.max_urls })}</Small
			>
		{/if}
		<button
			class="ms-auto min-w-24 h-8 btn variant-glass-primary hover:variant-filled-primary"
			on:click={handle_submit}
		>
			<SaveIcon strokeWidth="1.5" class="w-4 h-4" />
			<Small class="font-semibold">
				{$t('global:misc:save')}
			</Small>
		</button>
	</div>
</div>

<style>
	#max_usages {
		min-width: unset !important;
	}

	:global(#pell-textarea) {
		height: 400px;
	}
</style>
