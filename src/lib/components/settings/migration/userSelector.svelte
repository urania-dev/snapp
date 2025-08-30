<script lang="ts">
	import type { User } from "@prisma/client";

	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import * as Command from "$lib/components/ui/command";
	import * as Popover from "$lib/components/ui/popover";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { cn } from "$lib/utils.js";
	import { tick } from "svelte";

	let {
		onChange,
		user,
		userId = $bindable(),
		users = $bindable()
	}: {
		onChange: (userId: string) => void;
		user: User;
		userId?: null | string;
		users: User[];
	} = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	let loaded = $state(false);
	const selectedValue = $derived(users.find((u) => u.id === userId)?.username);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	const i18n = getTranslations();
	const f = $derived(page.data.fetch as typeof fetch);
	let query = $state<string>();
	const loadUsers = async () => {
		const user = page.data.user as User;
		if (user.role === "user") return;

		try {
			const res = (await (
				await f(
					`/api/user/findMany?q=${JSON.stringify({
						take: 10,
						where: query && {
							OR: [
								(query && { username: { contains: query } }) || {},
								(query && { email: { contains: query } }) || {}
							]
						}
					})}`,
					{ credentials: "include", method: "GET" }
				)
			).json()) as { data: User[] };
			users = res.data;
		} catch (error) {
			console.error(error);
		}
		loaded = true;
	};
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				disabled={user.role === "user"}
				class="w-full justify-between {(selectedValue === undefined && 'text-muted-foreground') ||
					''}"
				{...props}
				role="combobox"
				aria-expanded={open}
			>
				{selectedValue || i18n.t("migrations.select.user") + "..."}
				<i class="ph {user.role !== 'user' ? 'ph-caret-down' : 'ph-lock'} text-[20px]"></i>
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="!p-0">
		<Command.Root>
			<Command.Input placeholder={i18n.t("users.placeholders.search")} />
			<Command.List>
				<Command.Empty forceMount={users.length === 0 && loaded === true}
					>{i18n.t("errors.auth.user-not-found")}</Command.Empty
				>
				<Command.Group>
					{#await loadUsers()}
						<div class="flex min-h-20 w-full shrink-0 items-center justify-center">
							<div class="m-auto h-5 w-5 animate-spin duration-1000">
								<i class="ph ph-spinner text-[20px]"></i>
							</div>
						</div>
					{:then}
						{#key users}
							{#each users as user (user.id)}
								<Command.Item
									value={user.id}
									class="flex items-center"
									onSelect={() => {
										userId = user.id;
										onChange(userId);
										closeAndFocusTrigger();
									}}
								>
									<i
										class={cn(
											userId !== user.id && "text-transparent",
											"ph-fill ph-circle text-[8px] leading-[1rem]"
										)}
									></i>
									<span>{user.username}</span>
								</Command.Item>
							{/each}
						{/key}
					{/await}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
