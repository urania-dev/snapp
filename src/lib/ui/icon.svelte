<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		ph: icon,
		style = 'regular',
		size = 20,
		css
	}: {
		ph: string;
		style?: 'regular' | 'bold' | 'thin' | 'duotone' | 'fill';
		size?: number;
		css?: { [key: string]: string };
	} = $props();
</script>

<div class="inline-flex justify-center items-center w-max h-max">
	<i
		class={cn(
			style !== 'regular' ? `ph-${style}` : 'ph',
			`ph-${icon}`,

			css?.['icon']
		)}
		style:font-size={size ? `${size}px` : undefined}
	></i>
</div>
