<script lang="ts">
	import { goto } from '$app/navigation';
	import { getLocale } from '$lib/i18n';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	type States = 'error' | 'warning' | 'surface' | 'success' | undefined;
	export let state: States = 'surface';
	export let message: string;
	export let args: { [key: string]: string } = {};
	export let redirect: string | undefined = undefined;
	const { t } = getLocale();

	async function handle_click_toast() {
		dispatch('closeToast');
	}
</script>

<div>
	{#if redirect}
		<a href={redirect}>
			<button
				class:error={state === 'error'}
				class:warning={state === 'warning'}
				class:success={state === 'success'}
				class:surface={state === 'surface'}
				class={`card w-[360px] text-left right-0 left-auto p-4 pointer-events-[all]`}
				on:click={handle_click_toast}
			>
				<div class="pointer-events-none">
					{@html $t(message, args)}
				</div>
			</button>
		</a>
	{:else}
		<button
			class:error={state === 'error'}
			class:warning={state === 'warning'}
			class:success={state === 'success'}
			class:surface={state === 'surface'}
			class={`card w-[360px] text-left right-0 left-auto p-4 pointer-events-[all]`}
			on:click={handle_click_toast}
		>
			<div class="pointer-events-none">
				{@html $t(message, args)}
			</div>
		</button>
	{/if}
</div>

<style lang="postcss">
	:global(.card.error) {
		@apply bg-error-600-300-token text-surface-50-900-token;
	}
	:global(.card.warning) {
		@apply bg-warning-600-300-token text-surface-900-50-token;
	}
	:global(.card.surface) {
		@apply bg-surface-600-300-token text-surface-50-900-token;
	}
	:global(.card.success) {
		@apply bg-success-600-300-token text-surface-50-900-token;
	}
</style>
