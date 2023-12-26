<script lang="ts">
	import { env } from '$env/dynamic/public';

	let { data } = $props();
</script>

<slot />

<svelte:head>
	{#if data.website_id}
		<script async src="{data.umami_url}/script.js" data-website-id={data.website_id}></script>
	{/if}

	<meta
		name="description"
		content="Discover the power of Snapp, your self-hostable URL shortening service. Effortlessly
	shorten links, and with Snapp's self-hosting capability, you have complete control. Create
	concise, shareable links on your terms with Snapp's user-friendly platform."
	/>
	<meta name="keywords" content="short-url, shortlink, short-link, shortener, snapp" />
	<meta property="og:title" content="Snapp.li" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={env.PUBLIC_URL} />
	<meta property="og:image" content="{env.PUBLIC_URL}/media.svg" />
</svelte:head>
