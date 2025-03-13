<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { decode } from 'html-entities';
	import { toast } from 'svelte-sonner';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { Button } from '../ui/button';
	import { Input } from '../ui/input';
	import { singleSchema, type SingleSnappSchema } from './schema';

	const { formSchema }: { formSchema: SuperValidated<Infer<SingleSnappSchema>> } = $props();

	const form = superForm(formSchema, {
		applyAction: true,
		invalidateAll: true,
		onResult:async()=>{
			if (page.form?.message) toast.info(decode(i18n.t(page.form.message)));
		},
		onError: async () => {
			if (page.form?.message) toast.info(decode(i18n.t(page.form.message)));
		},
		validators: zodClient(singleSchema)
	});

	const { enhance, form: formData } = form;
	const i18n = getTranslations();

	let showSecret = $state(false);
</script>

<form
	id="try-secret"
	class="flex w-full flex-col overflow-x-clip"
	method="post"
	action="?/trySecret"
	use:enhance
>
	<div
		class="mx-auto flex w-full max-w-5xl grow flex-col gap-4 overflow-hidden lg:max-w-full lg:flex-row lg:gap-0"
	>
		<div class="flex w-full flex-col gap-2">
			<Form.Field {form} name="secret" class="px-3">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="px-2">{i18n.t('snapps.fields.secret')}</Form.Label>
						<div class="flex gap-2">
							<Input
								{...props}
								autofocus
								autocomplete="off"
								aria-autocomplete="none"
								icon="password"
								type={showSecret ? 'text' : 'password'}
								bind:value={$formData.secret}
							/>
							<Button
								class="aspect-square h-10 w-10"
								onclick={() => {
									showSecret = !showSecret;
								}}
								variant="ghost"
								>{#if showSecret}<i class="ph-duotone ph-eye text-[20px]"></i>{:else}<i
										class="ph ph-eye-closed text-[20px]"
									></i>{/if}</Button
							>
						</div>
					{/snippet}
				</Form.Control>
				<Form.Description class="px-2">
					{i18n.t('snapps.helpers.provide-secret')}
				</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
			<Button type="submit" class="mx-auto h-9 max-w-max" variant="outline"
				>{i18n.t('globals.continue')}</Button
			>
		</div>
	</div>
</form>
