<script lang="ts">
	import SaveIcon from 'lucide-svelte/icons/save';
	import { applyAction, enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { getLocale } from '$lib/i18n';
	import { Lead, Small } from '$lib/ui/typography';
	import EmailIcon from 'lucide-svelte/icons/mail';
	import type { SubmitFunction } from '../../../routes/(frontend)/dashboard/settings/admin/blacklists/$types.d.ts';
	import { toast } from 'svelte-sonner';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';
	import { invalidate } from '$app/navigation';
	import { getModalStore } from '@skeletonlabs/skeleton';

	const { t } = getLocale();
	const storeModal = getModalStore();

	let email: string;

	const enhanceEmailWhitelist: SubmitFunction = function ({ formData }) {
		if (email) formData.set('email', email);

		return async function ({ result }) {
			await applyAction(result);
			if (result.status === 200 && $page.form?.message) {
				toast.custom(CustomToast, {
					componentProps: {
						message: $page.form?.message,
						state: 'success'
					}
				});
				storeModal.close();
			} else if (result.status !== 200 && $page.form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: $page.form.message,
						state: 'error'
					}
				});
			await invalidate('snapp:admin:settings:whitelists');
		};
	};

	function handle_enter_submit(this: HTMLButtonElement, event: Event) {
		const keyEvent = event as KeyboardEvent;
		if (keyEvent.code !== 'Enter' && keyEvent.code !== 'NumpadEnter') return;
		this.form?.requestSubmit();
	}
	function handle_submit(this: HTMLButtonElement) {
		document.forms.namedItem('add-email')?.requestSubmit();
	}
</script>

<div class="card w-full container max-w-md">
	<div class="card-header flex items-center justify-between h-14 py-0">
		<Lead>{$t('settings:app:whitelists:email:add')}</Lead>
	</div>
	<form
		id="add-email"
		method="post"
		action="/dashboard/settings/admin/blacklists?/whiteEmail"
		use:enhance={enhanceEmailWhitelist}
	>
		<div class="card-body p-4 flex flex-col">
			<label for="email" class="flex flex-col gap-1 mb-2">
				<div class="input-group variant-glass input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						<EmailIcon strokeWidth="1.5" class="w-5 h-5" />
					</div>
					<input
						class="input variant-glass rounded-none"
						class:input-error={$page.form?.email}
						id="email"
						on:input={handle_enter_submit}
						type="text"
						name="email"
						placeholder={$t('settings:app:whitelists:email:placeholder')}
						bind:value={email}
					/>
				</div>
			</label>
		</div>
	</form>
	<div class="card-footer py-3 flex items-center gap-2">
		<button class="btn variant-glass-surface me-auto" type="submit" on:click={storeModal.close}>
			<Small>{$t('global:misc:cancel')}</Small>
		</button>
		<button
			class="btn variant-filled-primary flex gap-2 items-center"
			type="submit"
			on:click={handle_submit}
		>
			<SaveIcon class="w-4 h-4" />
			<Small>{$t('global:misc:save')}</Small>
		</button>
	</div>
</div>
