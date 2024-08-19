<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		ph: icon,
		style = 'regular',
		size = 20,
		css
	}: {
		ph: string;
		style?: 'regular' | 'bold' | 'thin' | 'duotone'|'fill';
		size?: number;
		css?: { [key: string]: string };
	} = $props();
</script>

<i
	class={cn(
		style !== 'regular' ? `ph-${style}` : 'ph',
		`ph-${icon}`,
		`inline-flex aspect-square w-${size / 4} h-${size / 4}`,
		css?.['icon']
	)}
	style:font-size={size ? `${size}px` : undefined}
></i>
