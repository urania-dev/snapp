<script lang="ts">
	import * as Button from '$lib/components/ui/button/index.js';

	let {
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: Button.Props = $props();
</script>

<Button.Root bind:ref type="submit" {...restProps} />
