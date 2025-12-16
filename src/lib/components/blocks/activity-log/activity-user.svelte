<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';

	const { image, username }: { image?: null | string; username?: null | string } = $props();
</script>

<div class="w-full flex gap-2 items-center pe-4">
	<Avatar.Root>
		<Avatar.Image src={image} />
		<Avatar.Fallback>{username?.slice(0, 2)}</Avatar.Fallback>
	</Avatar.Root>
	<span class="text-sm font-semibold">{username}</span>
</div>
