<script lang="ts">
	import CaseSensitiveIcon from '@lucide/svelte/icons/case-sensitive';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeClosedIcon from '@lucide/svelte/icons/eye-closed';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import HashIcon from '@lucide/svelte/icons/hash';
	import KeyIcon from '@lucide/svelte/icons/key';
	import LinkIcon from '@lucide/svelte/icons/link-2';
	import MousePointerClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SaveIcon from '@lucide/svelte/icons/save';
	import TagIcon from '@lucide/svelte/icons/tag';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { invalidateAll } from '$app/navigation';
	import Dialog from '$lib/components/blocks/commons/dialog.svelte';
	import Notes from '$lib/components/blocks/commons/notes.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Button } from '$lib/components/ui/button';
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Item from '$lib/components/ui/item';
	import * as Select from '$lib/components/ui/native-select';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import * as Table from '$lib/components/ui/table';
	import { m } from '$lib/paraglide/messages';
	import { createTag, createURL } from '$lib/remotes/urls.remote.js';
	import { slugify, underscore } from '$lib/utils.js';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';

	let hasLimits = $state(false);
	let hasPassword = $state(false);
	let hasExpiration = $state(false);

	let showPassword = $state(false);
	let showTags = $state(false);
	let showTeams = $state(false);
	let showUTM = $state(false);

	let notes = $state<string>();
	let triggerRefTags = $state<HTMLButtonElement>(null!);
	let triggerRefTeams = $state<HTMLButtonElement>(null!);

	const { data } = $props();

	let tags = $state<string[]>([]);
	let teams = $state<string[]>([]);
	const selectedTags = $derived(data.tags.filter((f) => tags.includes(f.id)).map((t) => t.tag));
	const selectedTeams = $derived(data.teams.filter((f) => teams.includes(f.id)).map((t) => t.name));

	const closeAndFocusTriggerTags = () => {
		showTags = false;
		tick().then(() => {
			triggerRefTags.focus();
		});
	};
	const closeAndFocusTriggerTeams = () => {
		showTags = false;
		tick().then(() => {
			triggerRefTeams.focus();
		});
	};

	let tagQuery = $state<string>('');
	let teamQuery = $state<string>('');

	const forceMount = $derived(data.tags.filter((t) => t.tag.includes(tagQuery))?.length === 0);

	let utms = $state<{ key: string; name: string; value: string }[]>([]);
	let expirationUnit = $state('minutes');
	let _exp = $state<number>(0);

	let expiration = $derived.by(() => {
		if (!_exp) return;
		const value = !isNaN(_exp) ? _exp : null;
		if (value === null) return;
		switch (expirationUnit) {
			case 'days':
				return value * 24 * 60 * 60 * 1000;
			case 'hours':
				return value * 60 * 60 * 1000;
			case 'minutes':
				return value * 60 * 1000;
			case 'months':
				return value * 30 * 24 * 60 * 60 * 1000;
			case 'weeks':
				return value * 7 * 24 * 60 * 60 * 1000;
			case 'years':
				return value * 365 * 24 * 60 * 60 * 1000;
		}
	});
</script>

<form
	class="@container flex w-full grow flex-col"
	{...createURL.enhance(async ({ submit }) => {
		try {
			await submit();
		} catch (error) {
			console.error(error);
			const e = error as { body?: { message?: string } };
			toast.error(e?.body?.message || m.errors_generic());
		}
	})}
>
	<div class="flex bg-background! z-20 h-14 w-full items-center gap-4 border-b p-4">
		<div class="flex gap-2 items-center">
			<LinkIcon class="size-8! fill-secondary/50" />
			<h1 class="text-2xl font-bold">{m.urls_create_new()}</h1>
		</div>
		<Button type="submit" class="ms-auto"
			><SaveIcon /><span class="hidden sm:block">{m.save_changes()}</span></Button
		>
	</div>
	<div class="grid w-full @3xl:grid-cols-2 @3xl:divide-y-0 divide-y @3xl:divide-x grow @3xl:pt-0!">
		<Field.Set class="flex gap-0 flex-col grow divide-y">
			<div class="p-4 min-h-30">
				<Field.Field data-invalid={Array.isArray(createURL.fields.originalUrl.issues())}>
					<Field.Label class="mb-1">{m.original_url()}</Field.Label>
					<Field.Content>
						<InputGroup.Root>
							<InputGroup.Addon><GlobeIcon /></InputGroup.Addon>
							<InputGroup.Input
								{...createURL.fields.originalUrl.as('url')}
								placeholder={m.original_url_placeholder()}
							/>
						</InputGroup.Root>
						{#each createURL.fields.originalUrl.issues() as issue (issue)}
							<Field.Error>{issue.message}</Field.Error>
						{:else}
							<Field.Description>{m.original_url_helper()}</Field.Description>
						{/each}
					</Field.Content>
				</Field.Field>
			</div>
			<div class="p-4 min-h-30">
				<Field.Field data-invalid={Array.isArray(createURL.fields.shortcode.issues())}>
					<Field.Content class="mb-1">
						<Field.Label>{m.shortcode()}</Field.Label>
					</Field.Content>
					<InputGroup.Root>
						<InputGroup.Addon><LinkIcon /></InputGroup.Addon>
						<InputGroup.Input
							placeholder={m.shortcode_placeholder()}
							aria-invalid={createURL.fields.shortcode.as('text')['aria-invalid']}
							name={createURL.fields.shortcode.as('text').name}
							oninput={(e) => (e.currentTarget.value = slugify(e.currentTarget.value))}
						/>
					</InputGroup.Root>
					{#each createURL.fields.shortcode.issues() as issue (issue)}
						<Field.Error>{issue.message}</Field.Error>
					{:else}
						<Field.Description>{m.shortcode_helper()}</Field.Description>
					{/each}
				</Field.Field>
			</div>
			<div class="flex w-full flex-col divide-y h-max">
				<div class="p-4 w-full">
					<Field.Field>
						<Field.Content>
							<Field.Title class="mb-1">{m.tags()}</Field.Title>
						</Field.Content>
						<Popover.Root bind:open={showTags}>
							<Popover.Trigger bind:ref={triggerRefTags}>
								{#snippet child({ props })}
									<Button
										variant="outline"
										class="justify-between w-full"
										{...props}
										role="combobox"
										aria-expanded={showTags}
									>
										<span class="text-start w-full">
											{selectedTags.join(', ') || m.select_tags()}
										</span>
										<ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
									</Button>
								{/snippet}
							</Popover.Trigger>
							<Field.Description>{m.urls_tags_helper()}</Field.Description>

							<Popover.Content class="p-0 w-[calc(100%-.25rem)] ms-auto" align="end">
								<Command.Root shouldFilter={false}>
									<Command.Input
										oninput={() => (tagQuery = slugify(tagQuery))}
										placeholder={m.search()}
										bind:value={tagQuery}
									/>
									<Command.List>
										<Command.Empty
											>{#if forceMount}<Button
													variant="ghost"
													size="sm"
													onclick={async () => {
														const { t } = await createTag(slugify(tagQuery));
														await invalidateAll();
														tags.push(t.id);
													}}><span>{tagQuery}</span><PlusIcon /></Button
												>{:else}<span>{m.tags_search_placeholder()}</span>{/if}</Command.Empty
										>
										<Command.Group>
											{#each data.tags.filter((t) => t.tag.includes(tagQuery)) as tag (tag)}
												<Command.Item
													value={tag.id}
													onSelect={() => {
														if (tags.includes(tag.id)) tags = [...tags.filter((t) => t !== tag.id)];
														else tags.push(tag.id);
														closeAndFocusTriggerTags();
													}}
												>
													<CheckIcon
														class={['me-2 size-4', !tags.includes(tag.id) && 'text-transparent']}
													/>
													{tag.tag}
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
					</Field.Field>
				</div>
				<div class="p-4 w-full">
					<Field.Field>
						<Field.Content>
							<Field.Title class="mb-1">{m.teams()}</Field.Title>
						</Field.Content>
						<Popover.Root bind:open={showTeams}>
							<Popover.Trigger bind:ref={triggerRefTeams}>
								{#snippet child({ props })}
									<Button
										variant="outline"
										class="justify-between w-full"
										{...props}
										role="combobox"
										aria-expanded={showTeams}
										><span class="text-start w-full">
											{selectedTeams.join(', ') || m.select_teams()}
										</span>
										<ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
									</Button>
								{/snippet}
							</Popover.Trigger>
							<Field.Description>{m.urls_teams_helper()}</Field.Description>

							<Popover.Content class="p-0 w-[calc(100%-.25rem)] ms-auto" align="end">
								<Command.Root shouldFilter={false}>
									<Command.Input
										placeholder={m.teams_search_placeholder()}
										bind:value={teamQuery}
									/>
									<Command.List>
										<Command.Empty><span>{m.tags_search_placeholder()}</span></Command.Empty>
										<Command.Group>
											{#each data.teams as team (team)}
												<Command.Item
													value={team.id}
													onSelect={() => {
														if (teams.includes(team.id))
															teams = [...teams.filter((tid) => tid !== team.id)];
														else teams.push(team.id);
														closeAndFocusTriggerTeams();
													}}
													><CheckIcon
														class={['me-2 size-4', !teams.includes(team.id) && 'text-transparent']}
													/>{team.name}
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
					</Field.Field>
				</div>
			</div>

			<div class="p-4 flex">
				<Item.Root variant="muted" class="w-full h-full items-start px-0">
					<Accordion.Root type="single" class="w-full">
						<Accordion.Item value="UTM">
							<Item.Content class="px-4">
								<Accordion.Trigger class="py-1">
									<span>{m.utm()}</span>
								</Accordion.Trigger>
								<span class="text-sm text-muted-foreground mb-4">
									{m.utm_helper()}
								</span>
							</Item.Content>
							<Accordion.Content class="border-y mb-0 p-0">
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head class="w-1/3 ps-4">{m.utm_name()}</Table.Head>
											<Table.Head class="w-1/3">{m.utm_key()}</Table.Head>
											<Table.Head class="w-1/3">{m.utm_value()}</Table.Head>
											<Table.Head class="w-max p-0 border-s"
												><Button
													variant="ghost"
													class="h-full"
													onclick={() => {
														showUTM = true;
													}}><PlusIcon /></Button
												></Table.Head
											>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each utms as utm, idx (utm)}
											<Table.Row class="h-10">
												<Table.Cell class="ps-4">{utm.name}</Table.Cell>
												<Table.Cell>{utm.key}</Table.Cell>
												<Table.Cell>{utm.value}</Table.Cell>
												<Table.Cell class="border-s p-0"
													><Button
														class="h-10 w-full"
														variant="ghost"
														onclick={() => {
															utms.splice(idx, 1);
														}}><TrashIcon /></Button
													></Table.Cell
												>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				</Item.Root>
			</div>
		</Field.Set>
		<div class="flex flex-col w-full h-full divide-y">
			<div class="p-4 @lg:mt-auto min-h-30">
				<Field.Label for="hasExpiration" class="min-h-20">
					<Field.Field orientation="horizontal">
						<Field.Content>
							<Field.Title>{m.expiration()}</Field.Title>
							<Field.Description>{m.set_expiration()}</Field.Description>
						</Field.Content>
						<Switch name="hasExpiration" id="hasExpiration" bind:checked={hasExpiration} />
					</Field.Field>
				</Field.Label>
			</div>
			{#if hasExpiration}
				<div class="p-4" in:fly={{ y: 12 }}>
					<Field.Field>
						<Field.Label>{m.expires_at()}</Field.Label>
						<Field.Content>
							<ButtonGroup class="w-full">
								<InputGroup.Root>
									<InputGroup.Addon><ClockIcon /></InputGroup.Addon>
									<InputGroup.Input
										type="number"
										class="w-2/3"
										pattern="\d+"
										style="appearance: textfield"
										bind:value={_exp}
										placeholder={m.expiration_placeholder()}
									/>
									<input type="number" name="expiresAt" hidden bind:value={expiration} />
								</InputGroup.Root>
								<Select.Root
									bind:value={expirationUnit}
									class="rounded-none border-s-0 rounded-e-md"
								>
									<Select.Option value="minutes">{m.time_minutes()}</Select.Option>
									<Select.Option value="hours">{m.time_hours()}</Select.Option>
									<Select.Option value="days">{m.time_days()}</Select.Option>
									<Select.Option value="weeks">{m.time_weeks()}</Select.Option>
									<Select.Option value="months">{m.time_months()}</Select.Option>
									<Select.Option value="years">{m.time_years()}</Select.Option>
								</Select.Root>
							</ButtonGroup>
							<Field.Description>{m.set_secret_helper()}</Field.Description>
						</Field.Content>
					</Field.Field>
				</div>
			{/if}

			<div class="p-4 min-h-30">
				<Field.Label for="hasLimits" class="h-full">
					<Field.Field orientation="horizontal">
						<Field.Content>
							<Field.Title>{m.limits()}</Field.Title>
							<Field.Description class="max-w-lg text-balance">{m.set_limits()}</Field.Description>
						</Field.Content>
						<Switch name="hasLimits" id="hasLimits" bind:checked={hasLimits} />
					</Field.Field>
				</Field.Label>
			</div>
			{#if hasLimits}
				<div class="p-4" in:fly={{ y: 12 }}>
					<Field.Field>
						<Field.Label>{m.limits()}</Field.Label>
						<Field.Content>
							<InputGroup.Root>
								<InputGroup.Addon><MousePointerClickIcon /></InputGroup.Addon>
								<InputGroup.Input
									class="w-2/3"
									type="number"
									pattern="\d+"
									style="appearance: textfield"
									name={createURL.fields.limit.as('text').name}
									aria-invalid={createURL.fields.limit.as('text')['aria-invalid']}
									placeholder={m.limits_placeholder()}
								/>
							</InputGroup.Root>
							<Field.Description class="max-w-md text-balance"
								>{m.set_limits_helper()}</Field.Description
							>
						</Field.Content>
					</Field.Field>
				</div>
			{/if}
			<div class="p-4">
				<Field.Label for="hasSecret" class="min-h-24 text-balance">
					<Field.Field orientation="horizontal">
						<Field.Content>
							<Field.Title>{m.urls_protect()}</Field.Title>
							<Field.Description class="max-w-lg">{m.secret_helper()}</Field.Description>
						</Field.Content>
						<Switch name="hasSecret" id="hasSecret" bind:checked={hasPassword} />
					</Field.Field>
				</Field.Label>
			</div>
			{#if hasPassword}
				<div class="p-4" in:fly={{ y: 12 }}>
					<Field.Field>
						<Field.Label>{m.secret()}</Field.Label>
						<Field.Content>
							<ButtonGroup class="w-full">
								<InputGroup.Root>
									<InputGroup.Addon><KeyIcon /></InputGroup.Addon>
									<InputGroup.Input
										{...createURL.fields._secret.as(showPassword ? 'text' : 'password')}
										placeholder={m.secret_placeholder()}
									/>
								</InputGroup.Root>
								<Button onclick={() => (showPassword = !showPassword)}
									>{#if showPassword}<EyeClosedIcon />{:else}<EyeIcon />{/if}</Button
								>
							</ButtonGroup>
							<Field.Description>{m.set_secret_helper()}</Field.Description>
						</Field.Content>
					</Field.Field>
				</div>
			{/if}
			<div class="p-4 flex flex-col grow">
				<Notes bind:notes placeholder={m.urls_notes_helper()} />
			</div>
		</div>
	</div>
	<input hidden name="teams" value={JSON.stringify(teams)} />
	<input hidden name="tags" value={JSON.stringify(tags)} />
	<input hidden name="utms" value={JSON.stringify(utms)} />
</form>
<Dialog title={m.create_one()} description={m.utm_helper()} bind:open={showUTM}>
	<form
		class="flex flex-col gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			const form = new FormData(e.currentTarget);

			const utmName = form.get('utm_name')?.toString();
			const utmKey = form.get('utm_key')?.toString();
			const utmValue = form.get('utm_value')?.toString();
			if (
				utmKey &&
				utmKey?.trim() !== '' &&
				utmName &&
				utmName?.trim() !== '' &&
				utmValue &&
				utmValue?.trim() !== ''
			) {
				// eslint-disable-next-line perfectionist/sort-sets
				utms = Array.from(new Set([...utms, { key: utmKey, name: utmName, value: utmValue }]));
				showUTM = false;
				e.currentTarget.reset();
			} else toast.error(m.errors_non_empty());
		}}
	>
		<Field.Field>
			<Field.Label>{m.utm_name()}</Field.Label>
			<InputGroup.Root>
				<InputGroup.Addon><CaseSensitiveIcon /></InputGroup.Addon>
				<InputGroup.Input name="utm_name" placeholder={m.utm_name_placeholder()} />
			</InputGroup.Root>
			<Field.Description>{m.utm_name_helper()}</Field.Description>
		</Field.Field>
		<Field.Field>
			<Field.Label>{m.utm_key()}</Field.Label>
			<InputGroup.Root>
				<InputGroup.Addon><TagIcon /></InputGroup.Addon>
				<InputGroup.Input
					onkeydown={(e) => (e.currentTarget.value = underscore(e.currentTarget.value))}
					name="utm_key"
					placeholder={m.utm_key_placeholder()}
				/>
			</InputGroup.Root>
			<Field.Description>{m.utm_name_helper()}</Field.Description>
		</Field.Field>
		<Field.Field>
			<Field.Label>{m.utm_value()}</Field.Label>
			<InputGroup.Root>
				<InputGroup.Addon><HashIcon /></InputGroup.Addon>
				<InputGroup.Input
					oninput={(e) => (e.currentTarget.value = slugify(e.currentTarget.value))}
					name="utm_value"
					placeholder={m.utm_value_placeholder()}
				/>
			</InputGroup.Root>
			<Field.Description>{m.utm_value_helper()}</Field.Description>
		</Field.Field>
		<Button class="mt-2" type="submit">{m.confirm()}</Button>
	</form>
</Dialog>
