<script lang="ts">
	import type { Tag } from '@prisma/client';
	import type { Snippet } from 'svelte';

	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { getTranslations } from '$lib/i18n/index.svelte';

	type ActionProps<T> = {
		children?: Snippet;
	} & {
		tag: T;
	};

	let { tag }: ActionProps<{ _count: { snapps: number } } & Tag> = $props();
	let open = $state<boolean>(false);
	let deleteDialogOpen = $state<boolean>(false);
	const i18n = getTranslations();
</script>

<Dialog.Root bind:open={deleteDialogOpen}>
	<div class="flex w-full">
		<DropdownMenu.Root bind:open>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="ms-auto h-8 w-8 text-xs">
						<i class="ph-bold ph-dots-three text-[18px]"></i>
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="grid gap-1" align="end">
				<DropdownMenu.Item>
					<Button
						variant="ghost"
						href="/dashboard?tag={tag.slug}"
						class="h-8 w-full shrink-0 justify-start p-0"
					>
						<i class="ph ph-eye text-[18px]"></i>
						<span class="capitalize">{tag.name}</span>
					</Button>
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					{#snippet child()}
						<Dialog.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									disabled={(tag._count.snapps && tag._count.snapps !== 0) || false}
									class="h-8 w-full justify-start p-1 px-2 text-sm hover:bg-destructive hover:text-destructive-foreground"
								>
									<i class="ph ph-trash text-[18px]"></i>
									<span>{i18n.t('globals.delete')}</span>
								</Button>
								<Dialog.Content class="max-w-sm">
									<Dialog.Header>
										<Dialog.Title>{i18n.t('globals.delete')}</Dialog.Title>
										<Dialog.Description class="text-balance">
											{i18n.t('tags.helpers.confirm-delete')}
										</Dialog.Description>
									</Dialog.Header>
									<div class="flex w-full justify-between gap-4">
										<Dialog.Close class={buttonVariants({ class: 'w-full', variant: 'outline' })}
											>{i18n.t('globals.close')}</Dialog.Close
										>
										<form
											action="/dashboard/tags?/delete"
											method="post"
											class="contents"
											use:enhance={({ formData }) => {
												formData.append('ids[]', tag.slug);

												return async ({ update }) => {
													await update({ invalidateAll: true });
													deleteDialogOpen = false;
												};
											}}
										>
											<Button variant="destructive" type="submit" class="w-full"
												>{i18n.t('globals.confirm')}</Button
											>
										</form>
									</div>
								</Dialog.Content>
							{/snippet}
						</Dialog.Trigger>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</Dialog.Root>
