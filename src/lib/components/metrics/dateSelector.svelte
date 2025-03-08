<script lang="ts">
	import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
	import { page } from '$app/state';
	import * as Select from '$lib/components/ui/select/index.js';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { getMetricsStore } from '$lib/stores/metrics.svelte';
	import { cn } from '$lib/utils';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fly } from 'svelte/transition';

	import { DatePicker } from '../datepicker';
	import { Button } from '../ui/button';
	import { Label } from '../ui/label';
	import * as Popover from '../ui/popover';

	const i18n = getTranslations();
	const mstore = getMetricsStore();
	let isDisabled = $state('');

	let presets = $state<{ label: string; pick: () => { end: Date; start: Date }; value: string }[]>([
		{
			label: i18n.t('date-picker.values.last-week'),
			pick: () => {
				const end = new Date();
				const start = new Date();
				start.setDate(end.getDate() - 7);
				end.setDate(end.getDate());
				return { end, start };
			},
			value: 'lastWeek'
		},
		{
			label: i18n.t('date-picker.values.last-2week'),
			pick: () => {
				const end = new Date();
				const start = new Date();
				start.setDate(end.getDate() - 14);
				end.setDate(end.getDate());
				return { end, start };
			},
			value: 'last2Week'
		},
		{
			label: i18n.t('date-picker.values.last-month'),
			pick: () => {
				const end = new Date();
				const start = new Date();
				start.setMonth(end.getMonth() - 1);
				end.setDate(end.getDate());
				return { end, start };
			},
			value: 'lastMonth'
		},
		{
			label: i18n.t('date-picker.values.last-6month'),
			pick: () => {
				const end = new Date();
				const start = new Date();
				start.setMonth(end.getMonth() - 6);
				end.setDate(end.getDate());
				return { end, start };
			},
			value: 'last6Month'
		},
		{
			label: i18n.t('date-picker.values.last-year'),
			pick: () => {
				const end = new Date();
				const start = new Date();
				start.setFullYear(end.getFullYear() - 1);
				end.setDate(end.getDate());
				return { end, start };
			},
			value: 'lastYear'
		}
	]);
	let preset = $state<string>();

	const onValueChange = (p: string) => {
		const { end, start } = presets.find((pp) => pp.value === p)!.pick();

		mstore.setStart(start);
		mstore.setEnd(end);
	};

	const triggerContent = $derived(
		presets.find((p) => p.value === preset)?.label ?? i18n.t('date-picker.labels.select')
	);
</script>

<div
	class="flex min-h-max w-full flex-col gap-2 py-2"
	in:fly={{
		duration: 400,
		opacity: prefersReducedMotion.current ? 1 : 0,
		y: prefersReducedMotion.current ? 0 : 12
	}}
>
	<div class="flex h-max flex-col px-2">
		<div class="flex w-full flex-wrap gap-4 lg:gap-2 xl:flex-nowrap">
			<div class="flex h-max w-full flex-col gap-2">
				<Label class="px-2">{i18n.t('globals.start')}</Label>
				<div class="flex">
					<Popover.Root
						onOpenChange={(open) => {
							if (open) isDisabled = 'end';
							else isDisabled = '';
							if (!open && !mstore.start)
								mstore.start = new CalendarDate(
									mstore.weekAgo.getFullYear(),
									mstore.weekAgo.getMonth() + 1,
									mstore.weekAgo.getDate()
								);
							preset = 'null';
						}}
					>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									disabled={isDisabled === 'start'}
									variant="outline"
									class={cn(
										'h-10 w-full justify-start p-1 px-2 text-left font-normal',
										!mstore.start && 'text-muted-foreground'
									)}
									{...props}
								>
									<i class="ph ph-calendar-blank text-[20px]"></i>
									{mstore.start ? mstore.df.format(mstore.start.toDate(getLocalTimeZone())) : ''}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-auto p-0">
							<DatePicker
								locale={page.data.locale}
								type="single"
								bind:value={mstore.start}
								maxValue={mstore.end}
								disabled={isDisabled === 'start'}
								onValueChange={(value) => {
									mstore.start =
										(value as CalendarDate) ||
										new CalendarDate(
											mstore.weekAgo.getFullYear(),
											mstore.weekAgo.getMonth() + 1,
											mstore.weekAgo.getDate()
										);
									preset = 'null';
								}}
							/>
						</Popover.Content>
					</Popover.Root>
				</div>
			</div>
			<div class="flex w-full flex-col gap-2">
				<Label class="px-2">{i18n.t('globals.end')}</Label>
				<Popover.Root
					onOpenChange={(open) => {
						if (open) isDisabled = 'start';
						else isDisabled = '';
						if (!open && !mstore.end)
							mstore.end = new CalendarDate(
								mstore.today.getFullYear(),
								mstore.today.getMonth() + 1,
								mstore.today.getDate()
							);
					}}
				>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								variant="outline"
								disabled={isDisabled === 'end'}
								class={cn(
									'h-10 w-full justify-start p-1 px-2 text-left font-normal',
									!mstore.end && 'text-muted-foreground'
								)}
								{...props}
							>
								<i class="ph ph-calendar-blank text-[20px]"></i>
								{mstore.end ? mstore.df.format(mstore.end.toDate(getLocalTimeZone())) : ''}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0">
						<DatePicker
							type="single"
							bind:value={mstore.end}
							locale={page.data.locale}
							minValue={mstore.start}
							onValueChange={(value) =>
								(mstore.end =
									(value as CalendarDate) ||
									new CalendarDate(
										mstore.today.getFullYear(),
										mstore.today.getMonth() + 1,
										mstore.today.getDate()
									))}
						/>
					</Popover.Content>
				</Popover.Root>
			</div>
			<div class="flex w-full flex-col gap-2">
				<Label class="px-2">{i18n.t('date-picker.labels.presets')}</Label>
				<Select.Root type="single" name="presets" bind:value={preset} {onValueChange}>
					<Select.Trigger class="w-full overflow-hidden text-ellipsis whitespace-nowrap">
						{triggerContent}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each presets as preset}
								<Select.Item value={preset.value} label={preset.label} />
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</div>
</div>
