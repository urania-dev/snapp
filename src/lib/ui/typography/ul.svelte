<script lang="ts">
	import { cn } from '$lib/utils/cn';
	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<ul class={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)}>
	<slot />
</ul>
