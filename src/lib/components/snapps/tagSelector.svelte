<script lang="ts">
	import type { Tag } from "@prisma/client";

	import { Button } from "$lib/components/ui/button/index.js";
	import * as Command from "$lib/components/ui/command/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { Debouncer } from "$lib/stores/debounce.svelte";
	import { slugify } from "$lib/utils.js";
	import { tick, untrack } from "svelte";
	import { prefersReducedMotion } from "svelte/motion";
	import { fly } from "svelte/transition";

	import { Badge } from "../ui/badge";

	let {
		f = fetch,
		showTrigger = true,
		tags = $bindable()
	}: { f?: typeof fetch; showTrigger?: boolean; tags: string[] } = $props();

	let open = $state(false);
	let value = $state("");
	let triggerRef = $state<HTMLButtonElement>(null!);
	let searchTag = $state<string>("");

	const selectedValue = $derived(tags.find((f) => f === value));

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
	let foundTags = $state<Tag[]>([]);

	$effect(() => {
		untrack(() => {
			fetchTags();
		});
	});

	const fetchTags = async () => {
		loading = true;
		try {
			const res = await (await f(`/api/tag/findMany?q=${JSON.stringify({ take: 5 })}`)).json();
			foundTags = res.data as Tag[];
		} catch (error) {
			console.error(error);
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
					{selectedValue || i18n.t("tags.placeholders.search")}
					<i class="ph-duotone ph-caret-up-down ml-2 shrink-0 opacity-50"></i>
				</Button>
			{/snippet}
		</Popover.Trigger>
	{/if}
	<Popover.Content class="p-0" align="end">
		<Command.Root shouldFilter={false}>
			<Command.Input
				class="h-10 py-1"
				placeholder={i18n.t("tags.placeholders.search")}
				onkeydown={debouncer.debounce(async () => {
					loading = true;
					if (searchTag.trim() === "" || !searchTag) {
						await fetchTags();
						return;
					}
					try {
						const res = await (
							await f(
								`/api/tag/findMany?q=${JSON.stringify({ take: 5, where: { slug: slugify(searchTag) } })}`
							)
						).json();

						foundTags = res.data as Tag[];
					} catch (error) {
						console.error(error);
					}
					loading = false;
				}, 250)}
				bind:value={searchTag}
			/>
			<Command.List>
				<Command.Empty forceMount={tags.length === 0 && foundTags.length === 0}>
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
							{#if !searchTag.length}
								<div class="h-5 w-5">
									<i class="ph ph-question text-[20px]"></i>
								</div>
							{:else}
								<Button
									class="h-8"
									onclick={async () => {
										try {
											const res = await (
												await f("/api/tag/upsert", {
													body: JSON.stringify({
														create: {
															name: searchTag,
															slug: slugify(searchTag)
														},
														update: {},
														where: {
															slug: slugify(searchTag)
														}
													}),
													credentials: "include",
													method: "post"
												})
											).json();
											if (res?.data) {
												tags.push((res.data as Tag).slug);
												foundTags.push(res.data as Tag);
											}
										} catch (error) {
											console.error(error);
										}
										closeAndFocusTrigger();
									}}
								>
									<span>{searchTag}</span>
									<i class="ph ph-plus"></i>
								</Button>
							{/if}
						</div>
					{/if}
				</Command.Empty>
				<Command.Group>
					{#each foundTags as tag (tag.slug)}
						<Command.Item
							onclick={() => {
								const idx = tags.findIndex((t) => t === tag.slug);
								if (idx !== -1) tags.splice(idx, 1);
								else tags.push(tag.slug);
								debouncer.debounce(() => {
									closeAndFocusTrigger();
								}, 1000)();
							}}>{tag.name}</Command.Item
						>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
	<div class="flex min-h-20 w-full flex-wrap content-start gap-1 p-2 empty:hidden">
		{#each tags as tag (tag)}
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
						if (!showTrigger) return;
						const idx = tags.findIndex((t) => t === tag);
						if (idx !== -1) tags.splice(idx, 1);
					}}
				>
					{tag}
					{#if showTrigger}
						<i class="ph ph-x"></i>
					{/if}
				</Badge>
			</div>
		{/each}
	</div>
</Popover.Root>
