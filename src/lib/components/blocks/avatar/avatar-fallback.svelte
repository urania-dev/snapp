<script lang="ts">
	import { cn } from '$lib/utils';
	import { Avatar as AvatarPrimitive } from 'bits-ui';
	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: AvatarPrimitive.FallbackProps = $props();
</script>

<AvatarPrimitive.Fallback
	bind:ref
	data-slot="avatar-fallback"
	class={cn('flex size-full items-center justify-center rounded-md bg-muted', className)}
	{...restProps}
/>
