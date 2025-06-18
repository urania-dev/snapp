<script lang="ts">
	import { page } from '$app/state';
	import P from '$lib/components/typography/text/p.svelte';
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { untrack } from 'svelte';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { vtAPISchema, type VtAPISchema } from './schema';

	const {
		vtForm
	}: {
		vtForm: SuperValidated<Infer<VtAPISchema>>;
	} = $props();
	const form = superForm(vtForm, {
		invalidateAll: true,
		resetForm: false,
		validationMethod: 'onsubmit',
		validators: zodClient(vtAPISchema)
	});

	const { enhance: superEnhance, form: formData } = form;
	const i18n = getTranslations();

	$effect(() => {untrack(() => checkStatus())});

	let status = $state(false);
	const checkStatus = async () => {
		try {
			const res = await (await (page.data.fetch as typeof fetch)('/admin/check-vt-api')).json();
			if (res && res.status) status = res.status;
		} catch (error) {
			console.error(error)	
		}
	};
</script>

<form id="vtapi" class="grid" method="post" action="?/vtapi" use:superEnhance>
	<div class="mt-4 flex items-center justify-between">
		<P class="!m-0 hidden w-full font-semibold md:block">{i18n.t('admin.labels.vt-api')}</P>
		<span class="h-max px-2">
			<i class="ph-duotone ph-circle {status === true ? 'text-green-500' : 'text-red-500'}"></i>
		</span>
	</div>
	<Form.Field {form} name="secret">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{i18n.t('snapps.fields.secret')}</Form.Label>
				<Input
					icon="key"
					placeholder={i18n.t('admin.placeholders.vt-api')}
					{...props}
					bind:value={$formData.secret}
					onblur={() => {
						if ($formData.secret !== null && $formData.secret?.trim() !== '')
							document.forms.namedItem('vtapi')?.requestSubmit();
					}}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<P class="!mt-0 text-sm text-muted-foreground"
		>{@html i18n.t('admin.helpers.vt-api', {
			url: 'https://umami.is/'
		})}</P
	>
</form>
