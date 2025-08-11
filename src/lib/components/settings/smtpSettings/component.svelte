<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import P from '$lib/components/typography/text/p.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { decode } from 'html-entities';
	import { toast } from 'svelte-sonner';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { smtpSchema, type SMTPSchema } from '../schema';

	const i18n = getTranslations();

	const {
		SMTP_SSL,
		smtpForm
	}: {
		SMTP_SSL: boolean;
		smtpForm: SuperValidated<Infer<SMTPSchema>>;
	} = $props();

	const form = superForm(smtpForm, {
		invalidateAll: true,
		onResult: async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
		},
		onSubmit: async ({ formData: fd }) => {
			Object.entries($formData).map(([key, value]) => {
				fd.set(key, String(value));
			});
		},
		resetForm: false,
		validationMethod: 'onsubmit',
		validators: zodClient(smtpSchema)
	});

	const { enhance: superEnhance, form: formData } = form;

	let sending = $state(false);
	let showPassword = $state(false);
	let SSL = $state(SMTP_SSL);

	beforeNavigate(({ cancel }) => {
		if (sending === true) {
			toast.info(i18n.t('globals.loading'));
			return cancel();
		}
	});
</script>

<div class="grid h-max w-full grid-cols-1 gap-2 md:gap-4">
	<P class="text-sm leading-normal">{@html decode(i18n.t('admin.helpers.smtp'))}</P>
	<form id="smtp" class="grid" method="post" action="?/updateSMTP" use:superEnhance>
		<Form.Field {form} name="host">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{decode(i18n.t('admin.labels.smtp-host'))}</Form.Label>
					<Input
						icon="computer-tower"
						placeholder={decode(i18n.t('admin.placeholders.smtp-host'))}
						{...props}
						bind:value={$formData.host}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="port">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{decode(i18n.t('admin.labels.smtp-port'))}</Form.Label>
					<Input
						type="number"
						icon="plug"
						style="appearance:textfield;"
						placeholder={decode(i18n.t('admin.placeholders.smtp-port'))}
						{...props}
						bind:value={$formData.port}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="user">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{decode(i18n.t('admin.labels.smtp-user'))}</Form.Label>
					<Input
						icon="user"
						placeholder={decode(i18n.t('admin.placeholders.smtp-user'))}
						{...props}
						bind:value={$formData.user}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="pass">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{decode(i18n.t('admin.labels.smtp-pass'))}</Form.Label>
					<div class="flex h-10 items-center gap-2">
						<Input
							type={showPassword ? 'text' : 'password'}
							icon="key"
							placeholder={decode(i18n.t('admin.placeholders.smtp-pass'))}
							{...props}
							bind:value={$formData.pass}
						/>
						<Button
							variant="outline"
							tabindex={-1}
							class="h-10 w-10"
							onclick={(e) => {
								e.preventDefault();
								showPassword = !showPassword;
							}}><i class="ph text-[20px] ph-{showPassword ? 'eye' : 'eye-closed'}"></i></Button
						>
					</div>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="from">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{decode(i18n.t('admin.labels.smtp-from'))}</Form.Label>
					<Input
						icon="envelope"
						placeholder={decode(i18n.t('admin.placeholders.smtp-from'))}
						{...props}
						bind:value={$formData.from}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</form>
	<div class="my-2 flex items-start justify-between">
		<div class="flex flex-col gap-2">
			<Label>{decode(i18n.t('admin.labels.SSL'))}</Label>
			<Label>
				<p class="max-w-[90%] text-sm leading-relaxed text-muted-foreground">
					{i18n.t('admin.helpers.smtp-ssl')}
				</p>
			</Label>
		</div>
		<div class="flex items-center">
			<Switch
				bind:checked={SSL}
				onCheckedChange={() => {
					$formData.ssl = SSL;
					document.forms.namedItem('smtp')?.requestSubmit();
				}}
			/>
		</div>
	</div>
	<div class="flex gap-4">
		<Button
			class="text-sm"
			onclick={(e) => {
				e.preventDefault();
				document.forms.namedItem('smtp')?.requestSubmit();
			}}
		>
			<span>
				{i18n.t('globals.save')}
			</span>
			<i class="ph-duotone ph-floppy-disk text-[24px]"></i>
		</Button>
		<form
			action="?/testSMTP"
			method="post"
			use:enhance={() => {
				sending = true;
				return async ({ result }) => {
					await applyAction(result);
					await invalidateAll();
					sending = false;
				};
			}}
		>
			<Button variant="outline" class="aspect-square" type="submit">
				<span>{i18n.t('admin.labels.smtp-test')}</span>
				<div
					class="flex aspect-square h-5 w-5 items-center justify-center duration-1000"
					class:animate-spin={sending}
				>
					<i class="ph ph-{sending ? 'spinner' : 'envelope'} text-[20px]"></i>
				</div>
			</Button>
		</form>
	</div>
</div>
