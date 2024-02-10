<script lang="ts">
	import { cn } from '$lib/utils/cn';
	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<p class={cn('text-sm leading-5 [&:not(:first-child)&:not(:first-of-type)]:mt-4', className)}>
	<slot />
</p>
