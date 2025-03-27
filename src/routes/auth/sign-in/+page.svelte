<script>
	import SignInForm from '$lib/components/auth/signInForm.svelte';
	import H3 from '$lib/components/typography/heading/h3.svelte';
	import P from '$lib/components/typography/text/p.svelte';
	import * as Card from '$lib/components/ui/card';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { fade } from 'svelte/transition';

	const { data } = $props();
	const i18n = getTranslations();
</script>

<div class="m-auto w-full max-w-md shrink-0 p-4" in:fade|global>
	<Card.Root class="w-full max-w-md transition-all">
		<Card.Header>
			<div class="flex items-center gap-3">
				<i class="ph-duotone ph-link-simple text-[32px]"></i><H3>{i18n.t('appname')}</H3>
			</div>
		</Card.Header>
		<Card.Content class="px-8">
			<SignInForm emailDisabled={data.emailDisabled} providers={data.providers} signInForm={data.form} />
		</Card.Content>
		<Card.Footer>
			{#if data.emailDisabled === false}
			<P class="text-center text-sm">
				{@html i18n.t('users.auth.go-to-signup', { url: '/auth/sign-up' })}
			</P>
			{/if}
		</Card.Footer>
	</Card.Root>
</div>
