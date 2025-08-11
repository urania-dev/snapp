<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Calendar as CalendarPrimitive, type WithoutChildrenOrChild } from 'bits-ui';

	import * as Calendar from './index.js';

	let {
		class: className,
		placeholder = $bindable(),
		ref = $bindable(null),
		value = $bindable(),
		weekdayFormat = 'short', // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.RootProps> = $props();
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<CalendarPrimitive.Root
	bind:value={value as never}
	bind:ref
	bind:placeholder
	{weekdayFormat}
	class={cn('p-3', className)}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<Calendar.Header>
			<Calendar.PrevButton />
			<Calendar.Heading />
			<Calendar.NextButton />
		</Calendar.Header>
		<Calendar.Months>
			{#each months as month}
				<Calendar.Grid>
					<Calendar.GridHead>
						<Calendar.GridRow class="flex">
							{#each weekdays as weekday}
								<Calendar.HeadCell>
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
