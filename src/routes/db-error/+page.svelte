<script>
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import H3 from '$lib/components/typography/heading/h3.svelte';
	import P from '$lib/components/typography/text/p.svelte';
	import * as Card from '$lib/components/ui/card';
	import SvelteSeo from "svelte-seo";

</script>

<div class="flex h-full w-full items-center justify-center p-4">
	<Card.Root class="w-full max-w-md">
		<img src="/db-placeholder.png" alt="DB OFFLINE" class="w-full object-cover" />
		<Card.Header>
			<div class="flex items-center gap-2">
				<i class="ph-duotone ph-warning text-[30px]"></i><H3>DB Offline</H3>
			</div>
		</Card.Header>
		<Card.Content>
			<P>The database is not responding. Please try again later.</P>
			<P class="flex flex-wrap content-start items-center gap-1 text-sm">You can reach us at:</P>
			<div class="mt-2 flex items-center gap-1">
				<i class="ph ph-at text-[20px]"></i>
				<a class="link flex items-center pb-1" href="mailto:{env.PUBLIC_ADMIN_CONTACT}">
					<span>{env.PUBLIC_ADMIN_CONTACT || 'Set ENV PUBLIC_ADMIN_CONTACT'}</span>
				</a>
			</div>
		</Card.Content>
		<Card.Footer
			><i
				class="ph-fill ph-circle ms-auto animate-ping text-destructive"
				style:animation-duration="2s"
			></i></Card.Footer
		>
	</Card.Root>
</div>
<SvelteSeo title={`${(page.data.appname||'Snapp')} | DB OFFLINE`} />
