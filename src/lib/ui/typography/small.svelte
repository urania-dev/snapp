<script lang="ts">
	import { cn } from '$lib/utils/cn';
	let className: string = '';
	export { className as class };
</script>

<small class={cn('text-sm font-medium', className)}><slot /></small>
