<script lang="ts">
	import { cn } from '$lib/utils/cn';
	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<span class={cn('text-sm text-tertiary-600-300', className)}><slot /></span>
