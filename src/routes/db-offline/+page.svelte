<script lang="ts">
	import favicon from '$lib/assets/logo.svg';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import { m } from '$lib/paraglide/messages';

	const { data } = $props();
</script>

<div class="p-4 m-auto flex flex-col w-full max-w-md gap-4 justify-center items-center">
	<Avatar.Root class="h-40! w-auto! aspect-auto object-contain rounded-md">
		<Avatar.Image src={favicon} class="aspect-auto" />
	</Avatar.Root>
	<Card.Root class="w-full flex flex-col max-w-md shrink-0 ">
		<Card.Header class="w-full">
			<Card.Title>
				{m.error()}
			</Card.Title>
			<Card.Description>
				{m.api_health_error_db_unknown()}
			</Card.Description>
		</Card.Header>
	</Card.Root>
	<small class="font-semibold first-letter:uppercase"
		>{m.powered_by({ appname: data.appname })}</small
	>
</div>
