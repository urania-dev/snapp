<script lang="ts">
	import { onMount } from 'svelte';
	import * as swaggerJson from './openapi.json';
	import './swagger-ui.css';
	import SwaggerUI from 'swagger-ui';

	onMount(async () => {
		SwaggerUI({
			spec: swaggerJson,
			dom_id: '#swagger-ui-container'
		});
	});
	export let data;

	let { theme } = data;
	$: ({ theme } = data);
</script>

<svelte:head>
	<title>Snapp | SwaggerUI</title>
</svelte:head>

<div class="page {theme}">
	<div id="swagger-ui-container" />
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
