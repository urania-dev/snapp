<script lang="ts">
	import { cn } from '$lib/utils';
	import { Avatar as AvatarPrimitive } from 'bits-ui';
	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: AvatarPrimitive.ImageProps = $props();
</script>

<AvatarPrimitive.Image
	bind:ref
	data-slot="avatar-image"
	class={cn('aspect-square size-full', className)}
	{...restProps}
/>
