<script lang="ts">
	import type { OnChangeFn } from '@tanstack/table-core';

	import { type CalendarDate, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	const id = $props.id();
	let {
		label,
		onValueChange,
		value = $bindable()
	}: {
		label: string;
		onValueChange?: OnChangeFn<DateValue | undefined>;
		value?: CalendarDate;
	} = $props();
	let open = $state(false);
</script>

<div class="flex flex-col gap-3 w-full">
	<Popover.Root bind:open>
		<ButtonGroup class="grow flex w-full">
			<Label for="{id}-date" class="bg-muted/30 border rounded-s-md w-max px-2 pe-3 ">
				<CalendarIcon class="size-4!" />
				<span>{label}</span>
			</Label>
			<Popover.Trigger id="{id}-date" class="grow flex">
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class={['justify-between font-normal pe-4', props.class]}
					>
						{value && value !== null
							? value?.toDate(getLocalTimeZone())?.toLocaleDateString(getLocale())
							: m.date_select()}
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto overflow-hidden p-0" align="end">
				<Calendar
					type="single"
					bind:value
					captionLayout="dropdown"
					onValueChange={(v) => {
						open = false;
						onValueChange?.(v);
					}}
				/>
			</Popover.Content>
		</ButtonGroup>
	</Popover.Root>
</div>
