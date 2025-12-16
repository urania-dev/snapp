<script>
	import UserCogIcon from '@lucide/svelte/icons/user-round-cog';
	import Avatar from '$lib/components/blocks/profile/avatar.svelte';
	import DeleteUser from '$lib/components/blocks/profile/delete-user.svelte';
	import Languages from '$lib/components/blocks/profile/languages.svelte';
	import Notes from '$lib/components/blocks/profile/notes.svelte';
	import Profile from '$lib/components/blocks/profile/profile.svelte';
	import Theme from '$lib/components/blocks/profile/theme.svelte';
	import Totp from '$lib/components/blocks/profile/totp.svelte';
	import { m } from '$lib/paraglide/messages';
	const { data } = $props();
</script>

<div class="@container flex h-full w-full flex-col">
	<div class="flex h-14 w-full items-center gap-4 border-b p-4">
		<UserCogIcon class="size-8! fill-secondary/50" />
		<h1 class="text-2xl font-bold">{m.profile()}</h1>
	</div>
	<div class="flex h-full flex-col @2xl:grid @2xl:grid-cols-12 @2xl:grid-rows-1 @2xl:divide-x">
		<div class="order-1 col-span-7 flex flex-col">
			<div class="flex h-max border-b p-4 md:max-h-28">
				<Avatar src={data.user.image || ''} />
			</div>
			<div class="flex h-max border-b p-4">
				<Profile host={data.host} accountProvider={data.accountProviders} user={data.user} />
			</div>
			<div class="flex h-max border-b p-4">
				<Totp user={data.user} />
			</div>
			<div class="flex h-max border-b p-4">
				<Theme />
			</div>
			<div class="flex h-max border-b p-4">
				<Languages />
			</div>
		</div>
		<div
			class="order-3 mt-auto flex h-max flex-col gap-2 border-t p-4 @2xl:col-span-7 @2xl:border-t-0 @2xl:border-r"
		>
			<DeleteUser />
		</div>
		<div class="order-2 col-span-5 flex flex-col p-4 @2xl:row-span-2">
			<Notes user={data.user} />
		</div>
	</div>
</div>
