<script lang="ts">
	import { getLocale } from '$lib/i18n';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	type States = 'error' | 'warning' | 'surface' | 'success' | undefined;
	export let state: States = 'surface';
	export let message: string;
	const { t } = getLocale();
</script>

<div>
	<button
		class:error={state === 'error'}
		class:warning={state === 'warning'}
		class:success={state === 'success'}
		class:surface={state === 'surface'}
		class={`card w-[360px] text-left right-0 left-auto p-4`}
		on:click={() => dispatch('closeToast')}
	>
		{@html $t(message)}
	</button>
</div>

<style lang="postcss">
	.error {
		@apply bg-error-600-300-token text-surface-50-900-token;
	}
	.warning {
		@apply bg-warning-600-300-token text-surface-50-900-token;
	}
	.surface {
		@apply bg-surface-600-300-token text-surface-50-900-token;
	}
	.success {
		@apply bg-success-600-300-token text-surface-50-900-token;
	}
</style>
