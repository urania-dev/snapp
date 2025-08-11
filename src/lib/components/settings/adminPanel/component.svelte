<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import P from '$lib/components/typography/text/p.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fly } from 'svelte/transition';
	const i18n = getTranslations();

	let {
		allowUnsecureHTTP,
		customRedirect = $bindable(),
		disableHome,
		enabledMFA,
		enableLimits,
		enableSignup
	}: {
		allowUnsecureHTTP: boolean;
		customRedirect: null | string;
		disableHome: boolean;
		enabledMFA: boolean;
		enableLimits: boolean;
		enableSignup: boolean;
	} = $props();

	const items = $state([
		{
			helper: 'settings.helpers.signups',
			id: 'EnableSignup',
			label: 'settings.label.enable-signup',
			value: enableSignup === true || false
		},
		{
			helper: 'settings.helpers.homepage',
			id: 'DisableHome',
			label: 'settings.label.disable-homepage',
			value: disableHome === true || false
		},
		{
			helper: 'settings.helpers.http',
			id: 'AllowUnsecureHTTP',
			label: 'settings.label.allow-http',
			value: allowUnsecureHTTP === true || false
		},
		{
			helper: 'settings.helpers.limits',
			id: 'EnableLimits',
			label: 'settings.label.enable-limits',
			value: enableLimits === true || false
		},
		{
			helper: 'users.auth.helpers.mfa',
			id: 'EnabledMFA',
			label: 'users.labels.mfa',
			value: enabledMFA === true || false
		}
	]);
</script>

{#each items as item}
	<div class="mt-2 flex items-start justify-between first-of-type:mt-0">
		<div class="flex w-full flex-col gap-2">
			<Label for={item.id} class="grid cursor-pointer gap-2">
				<P class="text-base font-semibold">{i18n.t(item.label)}</P>
				<P class="!m-0 max-w-[80%] text-sm leading-normal text-muted-foreground">
					{i18n.t(item.helper)}
				</P>
			</Label>
		</div>
		<div class="flex items-center pt-2">
			<Switch
				id={item.id}
				checked={item.value}
				onCheckedChange={() => {
					document.forms.namedItem(`save${item.id}`)?.requestSubmit();
				}}
			/>
		</div>
	</div>
	{#if item.id === 'DisableHome' && disableHome === true}
		<form
			class="flex w-full flex-col"
			transition:fly|global={{
				delay: prefersReducedMotion.current ? 0 : 400,
				y: prefersReducedMotion.current ? 0 : 12
			}}
			method="post"
			id="customRedirect"
			action="?/customRedirect"
			use:enhance={({ formData }) => {
				if (customRedirect) formData.set('customRedirect', customRedirect);
				return async ({ result }) => {
					await applyAction(result);
					await invalidateAll();
				};
			}}
		>
			<Label class="pb-2">{i18n.t('settings.label.custom-home-redirect')}</Label>
			<Input
				name="customRedirect"
				onchange={async () => {
					document.forms.namedItem('customRedirect')?.requestSubmit();
				}}
				type="text"
				bind:value={customRedirect}
			/>
		</form>
	{/if}
	<Separator />
{/each}

<form
	hidden
	id="saveEnableSignup"
	method="post"
	action="?/enableSignup"
	use:enhance={({ formData }) => {
		formData.set('signup', enableSignup === true ? 'false' : 'true');
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
		};
	}}
></form>
<form
	hidden
	id="saveDisableHome"
	method="post"
	action="?/toggleHome"
	use:enhance={({ formData }) => {
		formData.set('home', disableHome === true ? 'false' : 'true');
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
		};
	}}
></form>
<form
	hidden
	id="saveAllowUnsecureHTTP"
	method="post"
	action="?/allowHTTP"
	use:enhance={({ formData }) => {
		formData.set('http', allowUnsecureHTTP === true ? 'false' : 'true');
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
		};
	}}
></form>
<form
	hidden
	id="saveEnableLimits"
	method="post"
	action="?/toggleLimits"
	use:enhance={({ formData }) => {
		formData.set('limits', enableLimits === true ? 'false' : 'true');
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
		};
	}}
></form>
<form
	hidden
	id="saveEnabledMFA"
	method="post"
	action="?/toggleMFA"
	use:enhance={({ formData }) => {
		formData.set('mfa', enabledMFA === true ? 'false' : 'true');
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
		};
	}}
></form>
