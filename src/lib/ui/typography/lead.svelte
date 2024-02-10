<script lang="ts">
	import { cn } from '$lib/utils/cn';
	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<h2 class={cn('text-lg text-muted-foreground font-semibold tracking-wide', className)}><slot /></h2>
