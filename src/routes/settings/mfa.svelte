<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import Switch from '$lib/ui/switch.svelte';
	import { ENABLED_MFA } from '$lib/utils/constants';
	import { _ } from 'svelte-i18n';

	let {
		enabled_mfa = $bindable(),
		save_this
	}: {
		enabled_mfa: boolean;
		save_this(field: keyof User | string, value: string, table?: string): void;
	} = $props();
</script>

<div class="flex flex-col gap-4 w-full h-full justify-center align-center">
	<Card css={{ card: 'gap-4' }}>
		<Card css={{ card: 'flex-row justify-between py-2' }}>
			<h4 class="text-lg font-semibold">{@html $_('users.labels.mfa')}</h4>
			<span class="flex items-center">
				<Icon ph="crown" size={24}></Icon>
			</span>
		</Card>
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card css={{ card: 'h-full' }}>
				<Switch
					bind:value={enabled_mfa}
					label={$_('users.auth.enable-mfa')}
					helper={$_('users.auth.helpers.mfa')}
					idx={ENABLED_MFA}
					actions={{
						toggle: (e) => {
							const field = e.currentTarget.dataset.idx;
							if (field) save_this(field, String(!enabled_mfa), 'settings');
						}
					}}
				></Switch>
			</Card>
		</div>
	</Card>
</div>
