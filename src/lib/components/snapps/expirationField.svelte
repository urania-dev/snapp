<script lang="ts">
	import type { Infer, SuperForm } from 'sveltekit-superforms/client';

	import * as Form from '$lib/components/ui/form';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { formatTimeAgo } from '$lib/utils';
	import { decode } from 'html-entities';
	import { fly } from 'svelte/transition';

	import type { SnappSchema } from './schema';

	import { getExpiration, timeUnits } from '.';
	import P from '../typography/text/p.svelte';
	import Button from '../ui/button/button.svelte';
	import { Input } from '../ui/input';
	import { Label } from '../ui/label';
	import * as Select from '../ui/select';
	import { Switch } from '../ui/switch';

	let {
		form,
		formData = $bindable(),
		hasExpiration = $bindable()
	}: {
		form: SuperForm<Infer<SnappSchema>>;
		formData: Infer<SnappSchema>;
		hasExpiration: boolean;
	} = $props();
	const i18n = getTranslations();

	const units = timeUnits(i18n);
	let value = $state('hours');
	let timeSpan = $state(0);
	let newValue = $state<string>();
	const triggerContent = $derived(units.find((f) => f.id === value)?.value ?? '');
</script>

<div class="grid gap-2">
	<div class="mt-2 flex items-start justify-between">
		<div class="flex flex-col gap-2 px-2">
			<Label for="expiration">{decode(i18n.t('snapps.fields.has-expiration'))}</Label>
			<Label for="expiration">
				<p class="max-w-[90%] text-balance text-sm leading-relaxed text-muted-foreground">
					{decode(i18n.t('snapps.helpers.expiration'))}
				</p>
			</Label>
		</div>
		<div class="flex items-center">
			<Switch id="expiration" bind:checked={hasExpiration} />
		</div>
	</div>
	{#if hasExpiration && formData.expiresAt === undefined}
		<div class="grid w-full items-end" transition:fly|global={{ duration: 400, y: 25 }}>
			<Form.Field {form} name="expiresAt" class="mb-2 w-full">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="px-2">{i18n.t('snapps.fields.expiration')}</Form.Label>
						<div class="flex w-full gap-2">
							<input type="text" name="expiresAt" hidden bind:value={newValue} />
							<Input
								icon="clock"
								{...props}
								name="time-field"
								onblur={() => {
									if (timeSpan > 0)
										newValue = new Date(
											new Date().getTime() + getExpiration(timeSpan, value) * 1000
										).toISOString();
									else newValue = undefined;
								}}
								bind:value={timeSpan}
								type="number"
							/>
							<Select.Root
								type="single"
								bind:value
								onValueChange={() => {
									if (timeSpan > 0)
										newValue = new Date(
											new Date().getTime() + getExpiration(timeSpan, value) * 1000
										).toISOString();
									else newValue = undefined;
								}}
							>
								<Select.Trigger class="w-full">
									{triggerContent}
								</Select.Trigger>
								<Select.Content>
									{#each units as unit}
										<Select.Item value={unit.id}>{unit.value}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					{/snippet}
				</Form.Control>

				<Form.FieldErrors />
			</Form.Field>
		</div>
	{:else if formData.expiresAt}
		<div
			class="flex w-full items-center justify-between ps-2"
			in:fly|global={{ duration: 400, y: 25 }}
		>
			<P class="text-sm text-muted-foreground">
				{i18n.t('snapps.helpers.previous-expiration', {
					relativeTime: formatTimeAgo(new Date(formData.expiresAt))!
				})}
			</P>
			<Button
				variant="outline"
				class="mt-1 max-w-max"
				onclick={(e) => {
					e.preventDefault();
					newValue = undefined;
					formData.expiresAt = undefined;
				}}
			>
				<i class="ph ph-trash text-[20px]"></i>
			</Button>
		</div>
	{/if}
</div>
