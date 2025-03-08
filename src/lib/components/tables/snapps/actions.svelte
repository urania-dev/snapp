<script lang="ts">
	import type { Snapp } from '@prisma/client';
	import type { Snippet } from 'svelte';

	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { toast } from 'svelte-sonner';

	type ActionProps<T> = {
		children?: Snippet;
	} & {
		isPrivate: boolean;
		snapp: T;
	};

	let { isPrivate = true, snapp }: ActionProps<Snapp> = $props();
	let open = $state<boolean>(false);
	let deleteDialogOpen = $state<boolean>(false);
	const i18n = getTranslations();
	let secureContext = $derived(browser && navigator.clipboard && page.url.protocol === 'https:');
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
						onclick={async (e) => {
							e.stopPropagation();
							e.preventDefault();
							const idx = snapp.shortcode;
							if (!secureContext) {
								toast.error(i18n.t('tokens.not-allowed-to-copy'));
								open = false;
								return;
							}

							const withPrefix = page.url.origin + '/' + idx;
							if (idx && navigator.clipboard) await navigator.clipboard.writeText(withPrefix);
							toast.info(i18n.t('snapps.helpers.copied-to-clipboard'));
							open = false;
						}}
						class="h-8 w-full justify-start p-0 text-sm"
					>
						<i class="ph ph-copy text-[18px]"></i>
						<span>{i18n.t('globals.copy')}</span>
					</Button>
				</DropdownMenu.Item>
				{#if snapp.userId === page.data.user.id || page.data.user.role !== 'user'}
					<DropdownMenu.Item>
						<Button
							variant="ghost"
							href="/dashboard/{snapp.id}"
							class="h-8 w-full justify-start p-0 text-sm"
						>
							<i class="ph ph-eye text-[18px]"></i>
							<span>{i18n.t('snapps.labels.details')}</span>
						</Button>
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<Button
							variant="ghost"
							href="/dashboard/edit/{snapp.id}"
							class="h-8 w-full shrink-0 justify-start p-0"
						>
							<i class="ph ph-pencil text-[18px]"></i>
							<span>{i18n.t('snapps.labels.edit')}</span>
						</Button>
					</DropdownMenu.Item>
				{/if}
				{#if isPrivate}
					<DropdownMenu.Item>
						{#snippet child()}
							<Dialog.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										variant="ghost"
										class="h-8 w-full justify-start p-1 px-2 text-sm hover:bg-destructive hover:text-destructive-foreground"
									>
										<i class="ph ph-trash text-[18px]"></i>
										<span>{i18n.t('globals.delete')}</span>
									</Button>
								{/snippet}
							</Dialog.Trigger>
						{/snippet}
					</DropdownMenu.Item>
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	{#if isPrivate}
		<Dialog.Content class="max-w-sm">
			<Dialog.Header>
				<Dialog.Title>{i18n.t('globals.delete')}</Dialog.Title>
				<Dialog.Description class="text-balance">
					{i18n.t('snapps.actions.confirm-delete')}
				</Dialog.Description>
			</Dialog.Header>
			<div class="flex w-full justify-between gap-4">
				<Dialog.Close class={buttonVariants({ class: 'w-full', variant: 'outline' })}
					>{i18n.t('globals.close')}</Dialog.Close
				>
				<form
					action="/dashboard?/delete"
					method="post"
					class="contents"
					use:enhance={({ formData }) => {
						formData.append('ids[]', snapp.id);

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
	{/if}
</Dialog.Root>
