<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';

	import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import LinkIcon from '@lucide/svelte/icons/link-2';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Item from '$lib/components/ui/item';
	import { m } from '$lib/paraglide/messages';
	import { updateLimits } from '$lib/remotes/config.remote';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';

	import EnableLimits from './enable-limits.svelte';
	const {
		host
	}: {
		host: THost;
	} = $props();
	let enabled = $derived(host.options.disable.limits);
	let limits = $derived(
		host.options.limits
			? host.options.limits!
			: { maxSnappPerUser: 0, requestsPerDay: 100, requestsPerMinute: 1440 }
	);
	// svelte-ignore state_referenced_locally
	let change = $state(limits);
	const isOriginal = $derived.by(() => {
		return Object.entries(limits).every(([k, v]) => {
			return change[k as keyof typeof change] === v;
		});
	});
</script>

<Item.Root class=" w-full p-0" size="sm">
	<Item.Root variant="outline" size="sm" class="w-full p-0">
		<Item.Content class=" w-full">
			<Accordion.Root type="single" class="w-full! max-w-none">
				<Accordion.Item value="watchlist" class="relative w-full p-0">
					<div class="flex w-full min-h-24">
						<Accordion.Trigger class="group  w-full max-w-none! px-4 no-underline!">
							<div class="flex w-full flex-col gap-1">
								<span>{m.control_enable_limits()}</span>
								<span class="max-w-md @xl:text-xs text-balance text-muted-foreground"
									>{m.control_enable_limits_helper()}</span
								>
							</div>
						</Accordion.Trigger>
					</div>
					<Accordion.Content class="w-full divide-y p-0">
						<form
							class="w-full"
							in:fly|global={{ y: 12 }}
							{...updateLimits.enhance(async ({ submit }) => {
								try {
									await submit();
								} catch (error) {
									console.error(error);
									toast.error(m.errors_settings_saving());
								}
							})}
						>
							<Field.Set
								class="@container flex min-h-[120px] w-full flex-col gap-0 divide-y overflow-hidden border-t border-border"
							>
								<div
									class="grid w-full grid-cols-1 divide-y @sm:grid-cols-2 @sm:divide-x @sm:divide-y-0!"
								>
									<div class="p-4">
										<EnableLimits {host} />
									</div>
									<div class="p-4">
										<Field.Field orientation="vertical">
											<Field.Label for="maxSnappPerUser">{m.spu()}</Field.Label>
											<InputGroup.Root>
												<InputGroup.Addon align="inline-start" class="pe-0!"
													><LinkIcon /></InputGroup.Addon
												>
												<InputGroup.Input
													placeholder={m.spu()}
													value={change.maxSnappPerUser}
													type={updateLimits.fields.limits.maxSnappPerUser.as('number').type}
													aria-invalid={updateLimits.fields.limits.maxSnappPerUser.as('number')[
														'aria-invalid'
													]}
													oninput={(e) =>
														(change.maxSnappPerUser = parseInt(e.currentTarget.value))}
													style="appearance: textfield"
													disabled={enabled === true}
												/>
											</InputGroup.Root>
											<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
												{m.spu_helper()}
											</Field.Description>
										</Field.Field>
									</div>
								</div>
								<div
									class="grid w-full grid-cols-1 divide-y @sm:grid-cols-2 @sm:divide-x @sm:divide-y-0!"
								>
									<div class="p-4">
										<Field.Field orientation="vertical">
											<Field.Label for="requestsPerMinute">{m.rpm()}</Field.Label>
											<InputGroup.Root>
												<InputGroup.Addon align="inline-start" class="pe-0!"
													><ClockIcon /></InputGroup.Addon
												>
												<InputGroup.Input
													placeholder={m.rpm()}
													value={change.requestsPerMinute}
													type={updateLimits.fields.limits.requestsPerMinute.as('number').type}
													aria-invalid={updateLimits.fields.limits.requestsPerMinute.as('number')[
														'aria-invalid'
													]}
													oninput={(e) =>
														(change.requestsPerMinute = parseInt(e.currentTarget.value))}
													style="appearance: textfield"
													disabled={enabled === true}
												/>
											</InputGroup.Root>
											<Field.Description
												class="mt-1! max-w-xl @xl:text-xs text-balance @sm:divide-y-0!"
											>
												{m.rpm_helper()}
											</Field.Description>
										</Field.Field>
									</div>
									<div class="p-4">
										<Field.Field orientation="vertical">
											<Field.Label for="requestsPerDay">{m.rpd()}</Field.Label>
											<InputGroup.Root>
												<InputGroup.Addon align="inline-start" class="pe-0!"
													><CalendarClockIcon /></InputGroup.Addon
												>
												<InputGroup.Input
													placeholder={m.rpd()}
													value={change.requestsPerDay}
													type={updateLimits.fields.limits.requestsPerDay.as('number').type}
													aria-invalid={updateLimits.fields.limits.requestsPerDay.as('number')[
														'aria-invalid'
													]}
													oninput={(e) => (change.requestsPerDay = parseInt(e.currentTarget.value))}
													style="appearance: textfield"
													disabled={enabled === true}
												/>
											</InputGroup.Root>
											<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
												{m.rpd_helper()}
											</Field.Description>
										</Field.Field>
									</div>
								</div>
								<div class="p-4">
									<ButtonGroup>
										<Button disabled={isOriginal}>{m.save_changes()}</Button>
									</ButtonGroup>
								</div>
							</Field.Set>
						</form>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</Item.Content>
	</Item.Root>
</Item.Root>
