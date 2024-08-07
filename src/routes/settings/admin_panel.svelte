<script lang="ts">
	import { _ } from 'svelte-i18n';

	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import Switch from '$lib/ui/switch.svelte';
	import {
		ALLOW_UNSECURE_HTTP,
		DISABLE_HOME,
		ENABLE_LIMITS,
		ENABLED_SIGNUP
	} from '$lib/utils/constants';
	import type { User } from 'lucia';

	let {
		enabled_signup = $bindable(),
		enable_limits = $bindable(),
		disable_home = $bindable(),
		allow_http = $bindable(),
		save_this
	}: {
		save_this(field: keyof User | string, value: string, table?: string): void;
		enabled_signup: boolean;
		enable_limits: boolean;
		allow_http: boolean;
		disable_home: boolean;
	} = $props();
</script>

<Card css={{ card: 'gap-4' }}>
	<Card css={{ card: 'flex-row justify-between py-2' }}>
		<h4 class="text-lg font-semibold">{@html $_('admin.label')}</h4>
		<span class="flex items-center">
			<Icon ph="crown" size={24}></Icon>
		</span>
	</Card>
	<div class="flex w-full flex-col gap-4 lg:flex-row">
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card css={{ card: 'h-full' }}>
				<Switch
					bind:value={enabled_signup}
					label={$_('settings.label.enable-signup')}
					helper={$_('settings.helpers.signups')}
					idx={ENABLED_SIGNUP}
					actions={{
						toggle: (e) => {
							const field = e.currentTarget.dataset.idx;
							if (field) save_this(field, String(!enabled_signup), 'settings');
						}
					}}
				></Switch>
			</Card>
		</div>
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card css={{ card: 'h-full' }}>
				<Switch
					bind:value={disable_home}
					label={$_('settings.label.disable-homepage')}
					helper={$_('settings.helpers.homepage')}
					idx={DISABLE_HOME}
					actions={{
						toggle: (e) => {
							const field = e.currentTarget.dataset.idx;
							if (field) save_this(field, String(!disable_home), 'settings');
						}
					}}
				></Switch>
			</Card>
		</div>
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card css={{ card: 'h-full' }}>
				<Switch
					bind:value={allow_http}
					label={$_('settings.label.allow-http')}
					helper={$_('settings.helpers.http')}
					idx={ALLOW_UNSECURE_HTTP}
					actions={{
						toggle: (e) => {
							const field = e.currentTarget.dataset.idx;
							if (field) save_this(field, String(!allow_http), 'settings');
						}
					}}
				></Switch>
			</Card>
		</div>
		<div class="inline-flex h-full w-full flex-col gap-4">
			<Card css={{ card: 'h-full shrink-0' }}>
				<Switch
					bind:value={enable_limits}
					label={$_('settings.label.enable-limits')}
					helper={$_('settings.helpers.limits')}
					idx={ENABLE_LIMITS}
					actions={{
						toggle: (e) => {
							const field = e.currentTarget.dataset.idx;
							if (field) save_this(field, String(!enable_limits), 'settings');
						}
					}}
				></Switch>
			</Card>
		</div>
	</div>
</Card>
