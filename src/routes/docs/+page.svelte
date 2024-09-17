<script lang="ts">
	import { onMount } from 'svelte';
	import * as swaggerJson from './openapi.json';
	import './swagger-ui.css';
	import SwaggerUI from 'swagger-ui';
	import { _ } from 'svelte-i18n';

	let { data } = $props();
	onMount(async () => {
		SwaggerUI({
			spec: JSON.parse(JSON.stringify(swaggerJson).replaceAll('https://snapp.li', data.origin)),
			dom_id: '#swagger-ui-container'
		});
	});


	let theme = $derived(data);
</script>

<svelte:head>
	<title>{$_('appname')} | Swagger UI</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>

<div class="page {theme}">
	<div id="swagger-ui-container"></div>
</div>

<style>
	/* Fast dark mode https://github.com/swagger-api/swagger-ui/issues/5327 */
	:global(.dark .swagger-ui) {
		filter: invert(88%) hue-rotate(180deg);
	}

	:global(.dark .swagger-ui .microlight) {
		filter: invert(100%) hue-rotate(180deg);
	}

	:global(.info__externaldocs) {
		display: none;
	}
</style>
