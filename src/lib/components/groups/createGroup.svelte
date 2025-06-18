<script lang="ts">
	import { groupSchema, type GroupSchema } from '$lib/components/groups/schema';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { slugify } from '$lib/utils';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let {
		createForm,
		open = $bindable()
	}: { createForm: SuperValidated<Infer<GroupSchema>>; open: boolean } = $props();

	const form = superForm(createForm, {
		invalidateAll: true,
		onResult: ({ result }) => {
			if (result.status === 200) open = false;
		},
		resetForm: false,
		validationMethod: 'onsubmit',
		validators: zodClient(groupSchema)
	});

	const { enhance: superEnhance, form: formData } = form;
	const i18n = getTranslations();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-sm">
		<Dialog.Header>
			<Dialog.Title>{i18n.t('users.groups.labels.create')}</Dialog.Title>
			<Dialog.Description class="text-balance pt-4">
				<form method="post" action="?/create" use:superEnhance>
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{i18n.t('users.groups.labels.name')}</Form.Label>
								<Input
									icon="tag-simple"
									{...props}
									bind:value={$formData.name}
									onkeyup={(e) => {
										$formData.slug = slugify(e.currentTarget.value);
									}}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="slug">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{i18n.t('tags.labels.slug')}</Form.Label>
								<Input
									icon="hash"
									{...props}
									bind:value={$formData.slug}
									onkeyup={(e) => {
										$formData.slug = slugify(e.currentTarget.value);
									}}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Button class="mt-2 w-full" type="submit">{i18n.t('globals.save')}</Button>
				</form>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
