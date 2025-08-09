<script lang="ts">
	import { type Snapp } from '@prisma/client'; 
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form';
	import * as Tabs from '$lib/components/ui/tabs';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { Debouncer } from '$lib/stores/debounce.svelte';
	import { decode } from 'html-entities';
	import { nanoid } from 'nanoid';
	import { toast } from 'svelte-sonner';
	import { SvelteMap } from 'svelte/reactivity';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import {
		ExpirationField,
		GroupSelector,
		MaxUsages,
		SecretField,
		TagSelector,
		UTMParams
	} from '.';
	import { Button } from '../ui/button';
	import { Input } from '../ui/input';
	import { Label } from '../ui/label';
	import { Separator } from '../ui/separator';
	import { Textarea } from '../ui/textarea';
	import { snappSchema, type SnappSchema } from './schema';

	const { formSchema }: { formSchema: SuperValidated<Infer<SnappSchema>> } = $props();
	const d = new Debouncer();
	const form = superForm(formSchema, {
		applyAction: true,
		invalidateAll: true,
		onError: async () => {
			if (page.form?.message) toast.info(decode(i18n.t(page.form.message)));
		},
		onResult: async ({ result }) => {
			if (result.status !== 200) return;
			await goto('/dashboard');
		},
		onSubmit: ({ formData: fd }) => {
			if (!$formData.shortcode) fd.set('shortcode', nanoid(5));
			if (hasSecret && $formData?.secret) fd.set('secret', $formData.secret);
			else fd.delete('secret');
			for (const tag of tags) fd.append('tags', tag);
			for (const group of groups) fd.append('groups', group);
			for (const [, params] of utmParams)
				fd.append('utmParams', JSON.stringify([params.key, params.value, params.name]));
		},
		resetForm: false,
		validationMethod: 'onsubmit',
		validators: zodClient(snappSchema)
	});

	const { enhance, form: formData } = form;
	const i18n = getTranslations();

	let hasSecret = $state(false);
	let hasExpiration = $state(false);
	let hasMaxUsages = $state(false);
	let slugExists = $state(false)

	let activeTab = $state('notes');
	let tags = $state<string[]>([]);
	let groups = $state<string[]>([]);
	let utmParams = $state(
		new SvelteMap<
			string,
			{
				key: string;
				name: string;
				value: string;
			}
		>([])
	);

	$effect(() => {
		$formData.tags = tags;
		$formData.groups = groups;
	});

	$effect(() => {
		if (page.form?.message) toast.info(decode(i18n.t(page.form.message)));
	});
</script>

<form
	id="create"
	class="flex h-[calc(100dvh_-_8.75rem)] w-full flex-col overflow-x-clip overflow-y-scroll"
	method="post"
	action="?/create"
	use:enhance
>
	<div class="mx-auto flex w-full max-w-5xl grow flex-col gap-4 lg:max-w-full lg:flex-row lg:gap-0">
		<div class="flex w-full flex-col gap-2 py-4">
			<Form.Field {form} name="originalUrl" class="px-3">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="px-2">{i18n.t('snapps.fields.original-url')}</Form.Label>
						<Input
							icon="globe-simple"
							placeholder={i18n.t('snapps.placeholders.original-url')}
							{...props}
							bind:value={$formData.originalUrl}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description class="px-2">
					{@html i18n.t('snapps.helpers.original-url')}
				</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
			<Separator />
			<Form.Field {form} name="shortcode" class="px-3">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="px-2">{i18n.t('snapps.fields.shortcode')}</Form.Label>
						<Input
							icon="link-simple"
							placeholder={i18n.t('snapps.placeholders.shortcode')}
							{...props}
							bind:value={$formData.shortcode}
							oninput={(e) => {
								const value = e.currentTarget.value;
								if (value.trim() !== '') {
									$formData.shortcode = value.replace(/\s+/g, '-');

									const f = page.data.fetch as typeof fetch;
									d.debounce(async () => {
										const {data,error} = (await(await f(`/api/snapp/findFirst?q=${JSON.stringify({where:{shortcode:value}})}`)).json() as {data?: null|Snapp, error?:{message:string}}) || {data:null, error:{message:"errors.generic"}};
										if(error) toast.error(error?.message)
										if(data){
											slugExists = true
											return
										}
										slugExists = false
									}, 500)();
								}
							}}
						/>
					{/snippet}
				</Form.Control>
				{#if slugExists}
				<Form.Description class="px-2 text-destructive">{@html i18n.t('snapps.helpers.shortcode-exists')}</Form.Description>
				{:else}
				<Form.Description class="px-2">{@html i18n.t('snapps.helpers.shortcode')}</Form.Description>
				{/if}
				<Form.FieldErrors />
			</Form.Field>
			<Separator />
			<div class="px-3">
				<SecretField bind:hasSecret {form} bind:formData={$formData} />
			</div>
			<Separator />
			<div class="px-3">
				<ExpirationField bind:hasExpiration {form} bind:formData={$formData} />
			</div>
			<Separator />
			<div class="px-3">
				<MaxUsages bind:hasMaxUsages {form} bind:formData={$formData} />
			</div>
			<Separator />
		</div>
		<Separator orientation="vertical" class="hidden lg:block" />
		<Tabs.Root bind:value={activeTab} class="w-full p-3 pt-0 lg:pt-3">
			<Tabs.List class="grid h-max w-full grid-cols-2 gap-2">
				<Tabs.Trigger class="min-w-max" value="notes">{i18n.t('snapps.fields.notes')}</Tabs.Trigger>
				<Tabs.Trigger class="min-w-max" value="advanced">{i18n.t('globals.advanced')}</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="notes" class="w-full grow">
				<Textarea
					name="notes"
					rows={10}
					bind:value={$formData.notes}
					class="h-full w-full"
					placeholder="..."
				/>
			</Tabs.Content>
			<Tabs.Content value="advanced" class="w-full">
				<div class="grid">
					<Label class="mb-2 p-2">{i18n.t('snapps.labels.utm-params')}</Label>
					<UTMParams bind:params={utmParams} />
					<Label class="mb-2 mt-4 p-2">{i18n.t('menu.tags')}</Label>
					<TagSelector bind:tags f={page.data.fetch} />
					<Label class="mb-2 mt-4 p-2">{i18n.t('menu.groups')}</Label>
					<GroupSelector bind:groups f={page.data.fetch} />
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>
	<div class="flex w-full border-t p-4">
		<Button class="ms-auto mt-auto" type="submit">{i18n.t('globals.save')}</Button>
	</div>
</form>
