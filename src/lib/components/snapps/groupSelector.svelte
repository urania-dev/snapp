<script lang="ts">
	import type { Group } from "@prisma/client";

	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Command from "$lib/components/ui/command/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { Debouncer } from "$lib/stores/debounce.svelte";
	import { slugify } from "$lib/utils";
	import { tick, untrack } from "svelte";
	import { prefersReducedMotion } from "svelte/motion";
	import { fly } from "svelte/transition";

	import P from "../typography/text/p.svelte";
	import { Badge } from "../ui/badge";

	let {
		f = fetch,
		groups = $bindable(),
		showTrigger = true
	}: { f?: typeof fetch; groups: string[]; showTrigger?: boolean } = $props();

	let open = $state(false);
	let value = $state("");
	let triggerRef = $state<HTMLButtonElement>(null!);
	let searchGroup = $state<string>("");

	const selectedValue = $derived(groups.find((f) => f === value));

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	const i18n = getTranslations();
	const debouncer = new Debouncer();

	let loading = $state(false);
	let foundGroups = $state<Group[]>([]);

	$effect(() => {
		untrack(() => {
			fetchGroups();
		});
	});

	const fetchGroups = async () => {
		loading = true;
		try {
			const res = await (await f(`/api/group/findMany?q=${JSON.stringify({ take: 5 })}`)).json();
			foundGroups = res.data as Group[];
		} catch (error) {
			console.error(error);
			foundGroups = [];
		}
		loading = false;
	};
</script>

<Popover.Root bind:open>
	{#if showTrigger}
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				<Button
					variant="outline"
					class="justify-between self-end"
					{...props}
					role="combobox"
					aria-expanded={open}
				>
					{selectedValue || i18n.t("users.groups.labels.placeholder")}
					<i class="ph-duotone ph-caret-up-down ml-2 shrink-0 opacity-50"></i>
				</Button>
			{/snippet}
		</Popover.Trigger>
		<P class="!mt-2 px-2 text-sm text-muted-foreground">{i18n.t("users.groups.helpers.in-snapp")}</P
		>
	{/if}
	<Popover.Content class="p-0" align="end">
		<Command.Root shouldFilter={false}>
			<Command.Input
				class="h-10 py-1"
				placeholder={i18n.t("users.groups.labels.placeholder")}
				onkeydown={debouncer.debounce(async () => {
					loading = true;
					if (searchGroup.trim() === "" || !searchGroup) {
						await fetchGroups();
						return;
					}
					try {
						const res = await (
							await f(
								`/api/group/findMany?q=${JSON.stringify({ take: 5, where: { slug: slugify(searchGroup), users: page.data.user !== "user" ? {} : { every: { id: page.data.user.id } } } })}`
							)
						).json();

						foundGroups = res.data as Group[];
					} catch (error) {
						console.error(error);
					}
					loading = false;
				}, 250)}
				bind:value={searchGroup}
			/>
			<Command.List>
				<Command.Empty forceMount={groups.length === 0 && foundGroups.length === 0}>
					{#if loading}
						<div class="flex h-full min-h-[100px] w-full items-center justify-center">
							<div class="h-5 w-5 animate-spin duration-1000">
								<i class="ph ph-spinner text-[20px]"></i>
							</div>
						</div>
					{:else}
						<div
							class="flex h-full min-h-[100px] w-full flex-col items-center justify-center gap-2"
						>
							{#if !searchGroup.length}
								<div class="h-5 w-5">
									<i class="ph ph-question text-[20px]"></i>
								</div>
							{:else if page.data.user.role !== "user"}
								<Button
									class="h-8"
									onclick={async () => {
										try {
											const res = await (
												await f("/api/group/upsert", {
													body: JSON.stringify({
														create: {
															name: searchGroup,
															slug: slugify(searchGroup)
														},
														update: {},
														where: {
															slug: slugify(searchGroup)
														}
													}),
													credentials: "include",
													method: "post"
												})
											).json();
											if (res?.data) {
												groups = [(res?.data as Group).slug];
												foundGroups.push(res.data as Group);
											}
										} catch (error) {
											console.error(error);
										}
										closeAndFocusTrigger();
									}}
								>
									<span>{searchGroup}</span>
									<i class="ph ph-plus"></i>
								</Button>
							{/if}
						</div>
					{/if}
				</Command.Empty>
				<Command.Group>
					{#each foundGroups as group (group.slug)}
						<Command.Item
							onclick={() => {
								const idx = groups.findIndex((t) => t === group.slug);
								if (idx !== -1) groups = [];
								else groups = [group.slug];
								debouncer.debounce(() => {
									closeAndFocusTrigger();
								}, 1000)();
							}}>{group.name}</Command.Item
						>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
	<div class="flex min-h-20 w-full flex-wrap content-start gap-1 p-2 empty:hidden">
		{#each groups as group (group)}
			<div
				class="grid"
				in:fly={{
					duration: 400,
					opacity: prefersReducedMotion ? 1 : 0,
					y: prefersReducedMotion.current ? 0 : 12
				}}
			>
				<Badge
					class="flex h-8 cursor-pointer items-center gap-2"
					onclick={() => {
						const idx = groups.findIndex((t) => t === group);
						if (idx !== -1) groups.splice(idx, 1);
					}}
				>
					{group}
					<i class="ph ph-x"></i>
				</Badge>
			</div>
		{/each}
	</div>
</Popover.Root>
