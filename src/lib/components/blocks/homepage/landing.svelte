<script lang="ts">
	import HeartIcon from '@lucide/svelte/icons/heart';
	import UserRoundCheckIcon from '@lucide/svelte/icons/user-round-check';
	import { resolve } from '$app/paths';
	import arrow from '$lib/assets/arrow.svg?raw';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { m } from '$lib/paraglide/messages';

	const isMobile = new IsMobile();
</script>

<section
	class="@container grid content-start justity-content-center grid-cols-1 px-10 h-svh w-screen items-center flex-col overflow-hidden"
>
	<nav class="max-w-4xl mx-auto h-18 flex items-center w-full p-4 px-0">
		<Button variant="outline" class="size-10! p-0 me-auto" href={resolve('/auth/sign-in')}>
			<UserRoundCheckIcon class="size-5!" /></Button
		>
		<div class="h-10 relative flex gap-4 ms-auto">
			<Button
				variant="outline"
				class="size-10! p-0"
				href="https://github.com/urania-dev/snapp"
				target="_blank"
			>
				<img
					src="https://cdn.simpleicons.org/github/black"
					class="size-5! dark:invert"
					alt="github"
				/></Button
			>
			<Button
				target="_blank"
				href="https://hub.docker.com/repository/docker/uraniadev/snapp"
				variant="outline"
				class="size-10! p-0"
			>
				<img
					src="https://cdn.simpleicons.org/docker/black"
					class="size-5! dark:invert"
					alt="docker"
				/></Button
			>
			<div
				class="arrow scale-x-100 -scale-y-100 -rotate-35 w-25! h-20 text-sidebar-primary absolute -start-18 top-3"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html arrow}
			</div>
			<span
				class="absolute top-16 -start-32 font-mono whitespace-nowrap text-secondary -rotate-25 text-center leading-none"
				>{m.support_us()}</span
			>
		</div>
	</nav>
	<div class="flex gap-4 pt-20 @lg:pt-30 w-full max-w-4xl mx-auto flex-col justify-start z-50">
		<div class="flex shrink-0 flex-col max-w-max w-full gap-4 justify-center">
			<Badge class="max-h-7 rounded-lg bg-primary/20 text-foreground border-primary font-semibold">
				{m.self_hosted()}
			</Badge>
			<h2 class="text-5xl whitespace-pre-wrap font-bold text-transparent animate-pan">
				{m.home_hero()}
			</h2>

			<p class="leading-relaxed text-balance w-full whitespace-normal @lg:whitespace-pre-wrap">
				{m.home_intro()}
			</p>
		</div>
		<div class="h-16 max-w-4xl w-full gap-4 mt-4 flex mb-10 mx-auto">
			<Button href="https://snapp.urania.dev/docs" variant="outline">{m.documentation()}</Button>
			<Button href="https://snapp.urania.dev/docs/getting-started">{m.getting_started()}</Button>
		</div>
	</div>
	<div class="py-4 pb-0 mt-auto relative max-w-max mx-auto">
		{#if !isMobile.current}
			<div class="w-80 absolute end-20 -top-65">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				<img
					src="/mascotte.png"
					class="max-w-5xl mx-auto w-full object-contain rounded-lg overflow-clip"
					alt="Mascotte"
				/>
			</div>
			<img
				src="/short-link.png"
				class="max-w-5xl mx-auto w-full object-contain border rounded-lg overflow-clip"
				alt={m.dashboard()}
			/>
		{:else}
			<img
				src="/mascotte.png"
				class="max-w-40 absolute -top-10 end-0 mx-auto w-full object-contain rounded-lg overflow-clip"
				alt={m.dashboard()}
			/>
			<img
				src="/mobile.png"
				class="max-w-xs mx-auto w-full mt-5 object-contain rounded-lg overflow-clip"
				alt={m.dashboard()}
			/>
		{/if}
	</div>
</section>
<div
	class="fixed bottom-0 start-0 end-0 bg-linear-to-t from-background/90 to-transparent via-background/50 p-3"
>
	<Badge variant="outline" class="text-xs bg-muted rounded-md p-2"
		>made with <HeartIcon class="text-secondary fill-current/20" /> urania.dev</Badge
	>
</div>

<style>
	@keyframes animbg {
		from {
			background-position: 0% center;
		}
		to {
			background-position: -200% center;
		}
	}
	:global(path.arrow) {
		fill: currentColor;
	}
	.animate-pan {
		animation: animbg 10s linear infinite;
		background: linear-gradient(
			to right,
			var(--color-primary),
			var(--color-sidebar-primary),
			var(--color-primary)
		);
		background-size: 200%;
		background-clip: text;
	}
</style>
