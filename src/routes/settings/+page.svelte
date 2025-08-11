<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { AdminPanel } from '$lib/components/settings/adminPanel';
	import Umami from '$lib/components/settings/adminPanel/umami.svelte';
	import Vtapi from '$lib/components/settings/adminPanel/vtapi.svelte';
	import { LimitsPanel } from '$lib/components/settings/limits';
	import { MigrationPanel } from '$lib/components/settings/migration';
	import { ProfilePanel } from '$lib/components/settings/profile';
	import { RESTAPIToken } from '$lib/components/settings/restAPIToken';
	import { SMTPSettings } from '$lib/components/settings/smtpSettings';
	import { WatchLists } from '$lib/components/settings/watchlists';
	import SettingsSidebar from '$lib/components/sidebar/settingsSidebar.svelte';
	import UTMGlobalParams from '$lib/components/snapps/utmGlobalParams.svelte';
	import H2 from '$lib/components/typography/heading/h2.svelte';
	import H4 from '$lib/components/typography/heading/h4.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { decode } from 'html-entities';
	import SvelteSeo from 'svelte-seo';
	import { toast } from 'svelte-sonner';
	import { prefersReducedMotion } from 'svelte/motion';
	import { SvelteURL } from 'svelte/reactivity';
	import { fly } from 'svelte/transition';
	const i18n = getTranslations();
	const { data } = $props();
	let url = $state(new SvelteURL(page.url));
	let active = $derived(url.hash || '#profile');

	const privates = $derived(data.private);
	const token = $derived(data.token);
	$effect(() => {
		if (page?.form?.message) toast.info(decode(i18n.t(page.form.message)));
	});
</script>

<div class="flex w-full flex-row items-center px-4">
	<div class="flex h-20 w-full items-center gap-2">
		<i class="ph-duotone ph-gear text-[32px]"></i>
		<H2 class="m-0 p-0">{i18n.t('menu.settings')}</H2>
	</div>
	<form action="?/signOut" use:enhance method="post">
		<Button type="submit">
			<i class="ph-bold ph-sign-out"></i>
			<span class="hidden md:block">
				{i18n.t('users.auth.sign-out')}
			</span>
		</Button>
	</form>
</div>
<Separator />
<div class="flex h-full w-full flex-col md:flex-row">
	<SettingsSidebar
		bind:url
		{active}
		isAdmin={data.user.role !== 'user'}
		enabledLimits={data.enableLimits}
	/>
	<Separator class="mx-0 hidden md:block" orientation="vertical" />
	<div
		class="flex h-[calc(100dvh_-_13rem)] w-full flex-col overflow-y-scroll md:h-[calc(100dvh_-_8.75rem)]"
	>
		{#key active}
			<div
				class="mx-auto flex w-full max-w-2xl flex-col content-start gap-4 p-4 py-5 pb-9"
				in:fly={{
					duration: 400,
					opacity: prefersReducedMotion.current ? 1 : 0,
					y: prefersReducedMotion.current ? 0 : 12
				}}
			>
				{#if active === '#profile'}
					<H4 class="mt-4 hidden md:block">{i18n.t('users.labels.profile')}</H4>
					<ProfilePanel
						{privates}
						serverSideEnabledMFA={data.serverSideEnabledMFA}
						availableLanguages={data.availableLanguages}
						profileForm={data.profileForm}
						user={data.user}
					/>
				{/if}
				{#if active === '#tokens'}
					<H4 class="mt-4 hidden md:block">{i18n.t('tokens.label')}</H4>
					<RESTAPIToken token={token?.key} sampleCode={data.sampleCode} stored={token} />
				{/if}
				{#if active === '#admin' && data.umamiForm && data.vtApiForm}
					<H4 class="mt-4 hidden md:block">{i18n.t('admin.label')}</H4>
					<AdminPanel
						enabledMFA={data.serverSideEnabledMFA}
						bind:customRedirect={data.customRedirect}
						allowUnsecureHTTP={data.allowUnsecureHTTP}
						disableHome={data.disableHome}
						enableLimits={data.enableLimits}
						enableSignup={data.enableSignup}
					/>
					<Umami umamiForm={data.umamiForm} />
					<Vtapi vtForm={data.vtApiForm} />
				{/if}
				{#if active === '#smtp' && data.smtpForm}
					<H4 class="mt-4 hidden md:block">{i18n.t('admin.labels.smtp')}</H4>
					<SMTPSettings smtpForm={data.smtpForm} SMTP_SSL={data.smtp.ssl as boolean | false} />
				{/if}
				{#if active === '#watchlists' && data.blackListForm && data.whiteListForm}
					<H4 class="mt-4 hidden md:block">{i18n.t('admin.labels.watchlists')}</H4>
					<WatchLists blackListForm={data.blackListForm} whiteListForm={data.whiteListForm} />
				{/if}
				{#if active === '#limits' && data.limitForm}
					<H4 class="mt-4 hidden md:block">{i18n.t('admin.labels.limits')}</H4>
					<LimitsPanel limitForm={data.limitForm} />
				{/if}
				{#if active === '#migration'}
					<H4 class="mt-4 hidden md:block">{i18n.t('migrations.label')}</H4>
					<MigrationPanel user={data.user} />
				{/if}
				{#if active === '#utmParams'}
					<UTMGlobalParams />
				{/if}
			</div>
		{/key}
	</div>
</div>

<SvelteSeo title={`${data.appname || 'Snapp'} | ${i18n.t('menu.settings')}`} />
