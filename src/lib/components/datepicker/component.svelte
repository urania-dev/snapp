<script lang="ts">
	import { DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import { page } from '$app/state';
	import * as Calendar from '$lib/components/ui/calendar';
	import * as Select from '$lib/components/ui/select';
	import { cn } from '$lib/utils.js';
	import { Calendar as CalendarPrimitive, type WithoutChildrenOrChild } from 'bits-ui';

	let {
		class: className,

		onChange,
		placeholder = $bindable(),
		value = $bindable(),
		weekdayFormat = 'short',
		...restProps
	}: { onChange?: () => void } & WithoutChildrenOrChild<CalendarPrimitive.RootProps> = $props();

	const monthOptions = Array.from({ length: 12 }, (_, i) =>
		new Intl.DateTimeFormat(page.data.locale, { month: 'long' }).format(new Date(2000, i))
	).map((month, i) => ({ label: month, value: i + 1 }));

	const monthFmt = new DateFormatter(page.data.locale, {
		month: 'long'
	});

	const yearOptions = Array.from({ length: 100 }, (_, i) => ({
		label: String(new Date().getFullYear() - i),
		value: new Date().getFullYear() - i
	}));

	const defaultYear = $derived(
		placeholder ? { label: String(placeholder.year), value: placeholder.year } : undefined
	);

	const defaultMonth = $derived(
		placeholder
			? {
					label: monthFmt.format(placeholder.toDate(getLocalTimeZone())),
					value: placeholder.month
				}
			: undefined
	);

	const monthLabel = $derived(
		monthOptions.find((m) => m.value === defaultMonth?.value)?.label ?? 'Select a month'
	);
</script>

<CalendarPrimitive.Root
	bind:value={value as never}
	bind:placeholder
	{weekdayFormat}
	class={cn('rounded-md p-3', className)}
	{...restProps}
	onValueChange={onChange}
	initialFocus={false}
>
	{#snippet children({ months, weekdays })}
		<Calendar.Header>
			<Calendar.Heading class="flex w-full items-center justify-between gap-2">
				<Select.Root
					type="single"
					value={`${defaultMonth?.value}`}
					onValueChange={(v) => {
						if (!v || !placeholder) return;
						if (v === `${placeholder?.month}`) return;
						placeholder = placeholder.set({ month: Number.parseInt(v) });
						onChange?.();
					}}
				>
					<Select.Trigger aria-label="Select month" class="w-[60%]">
						{monthLabel}
					</Select.Trigger>
					<Select.Content class="max-h-[200px] overflow-y-auto">
						{#each monthOptions as { label, value }}
							<Select.Item value={`${value}`} {label} />
						{/each}
					</Select.Content>
				</Select.Root>
				<Select.Root
					type="single"
					value={`${defaultYear?.value}`}
					onValueChange={(v) => {
						if (!v || !placeholder) return;
						if (v === `${placeholder?.year}`) return;
						placeholder = placeholder.set({ year: Number.parseInt(v) });
						onChange?.();
					}}
				>
					<Select.Trigger aria-label="Select year" class="w-[40%]">
						{defaultYear?.label ?? 'Select year'}
					</Select.Trigger>
					<Select.Content class="max-h-[200px] overflow-y-auto">
						{#each yearOptions as { label, value }}
							<Select.Item value={`${value}`} {label} />
						{/each}
					</Select.Content>
				</Select.Root>
			</Calendar.Heading>
		</Calendar.Header>
		<Calendar.Months>
			{#each months as month}
				<Calendar.Grid>
					<Calendar.GridHead>
						<Calendar.GridRow class="flex">
							{#each weekdays as weekday}
								<Calendar.HeadCell class="text-[10px] font-semibold uppercase">
									{weekday.slice(0, 2)}
								</Calendar.HeadCell>
							{/each}
						</Calendar.GridRow>
					</Calendar.GridHead>
					<Calendar.GridBody>
						{#each month.weeks as weekDates}
							<Calendar.GridRow class="mt-2 w-full">
								{#each weekDates as date}
									<Calendar.Cell {date} month={month.value}>
										<Calendar.Day />
									</Calendar.Cell>
								{/each}
							</Calendar.GridRow>
						{/each}
					</Calendar.GridBody>
				</Calendar.Grid>
			{/each}
		</Calendar.Months>
	{/snippet}
</CalendarPrimitive.Root>
