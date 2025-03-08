<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import H4 from '$lib/components/typography/heading/h4.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import { getTranslations } from '$lib/i18n/index.svelte';
	const i18n = getTranslations();

	let {
		enableMFA,
		serverSideEnabledMFA,
		tfs = false
	}: {
		enableMFA: boolean;
		serverSideEnabledMFA: boolean;
		tfs: boolean;
	} = $props();
</script>

<div class="my-2 mt-6 flex flex-col gap-4 md:gap-2">
	<H4>{i18n.t('users.labels.mfa')}</H4>
	<div class="my-2 flex items-start justify-between">
		<div class="flex flex-col gap-2">
			<Label for="enable-mfa" class="grid cursor-pointer gap-2">
				<p class="max-w-[70%] text-sm leading-normal text-muted-foreground">
					{i18n.t('users.auth.helpers.mfa-single')}
				</p>
			</Label>
		</div>
		<div class="flex items-center">
			<form
				id="enabled-mfa-private"
				method="post"
				action="?/toggleMFAPrivate"
				use:enhance={({ formData }) => {
					formData.set('mfa', String(enableMFA));

					return async ({ result }) => {
						await applyAction(result);
						await invalidateAll();
					};
				}}
			></form>
			<Switch
				id="enable-mfa"
				bind:checked={enableMFA}
				disabled={serverSideEnabledMFA === true}
				onCheckedChange={() => {
					document.forms.namedItem('enabled-mfa-private')?.requestSubmit();
				}}
			/>
		</div>
	</div>
	{#if tfs && enableMFA}
		<div class="my-2 flex flex-col gap-3">
			<Label>{i18n.t('users.auth.reset-mfa')}</Label>

			<Dialog.Root>
				<Dialog.Trigger
					class={buttonVariants({
						class: 'justify-start hover:bg-red-500 hover:text-white hover:dark:bg-red-700 ',
						variant: 'outline'
					})}>{i18n.t('globals.delete')}</Dialog.Trigger
				>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>{i18n.t('users.auth.reset-mfa')}</Dialog.Title>
						<Dialog.Description class="py-4">
							{i18n.t('users.auth.helpers.reset-mfa')}
						</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer>
						<form
							method="post"
							action="?/resetMFA"
							use:enhance={() => {
								return async ({ update }) => {
									await update({ invalidateAll: true, reset: true });
								};
							}}
						>
							<Button variant="destructive" type="submit" size="sm"
								>{i18n.t('globals.confirm')}</Button
							>
						</form>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	{/if}
</div>
