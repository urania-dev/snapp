<script lang="ts">
	import type { Separator as SeparatorPrimitive } from 'bits-ui';

	import { Separator } from '$lib/components/ui/separator/index.js';
	import { cn } from '$lib/utils';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: SeparatorPrimitive.RootProps = $props();
</script>

<Separator bind:ref class={cn('-mx-1 my-1 h-px bg-muted', className)} {...restProps} />
