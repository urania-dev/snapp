<script lang="ts">
	import { cn } from '$lib/utils';
	import { Avatar as AvatarPrimitive } from 'bits-ui';
	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: AvatarPrimitive.RootProps = $props();
</script>

<AvatarPrimitive.Root
	bind:ref
	data-slot="avatar"
	class={cn('relative flex size-8 shrink-0 overflow-hidden rounded-md', className)}
	{...restProps}
/>
