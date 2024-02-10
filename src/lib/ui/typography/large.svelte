<script lang="ts">
	import { cn } from '$lib/utils/cn';
	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<h1 class={cn('text-lg font-semibold', className)}><slot /></h1>
