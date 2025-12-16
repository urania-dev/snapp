<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeClosedIcon from '@lucide/svelte/icons/eye-closed';
	import PrivacyIcon from '@lucide/svelte/icons/hat-glasses';
	import * as Avatar from '$lib/components/ui/avatar';
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { trySecret } from '$lib/remotes/urls.remote.js';
	import { toast } from 'svelte-sonner';

	const { data } = $props();
	let showPassword = $state(false);
</script>

<div class="p-4 m-auto flex flex-col w-full max-w-max gap-4 justify-center items-center">
	{#if data.activeOrganization?.logo}
		<Avatar.Root class="h-40! w-auto! aspect-auto object-contain rounded-md">
			<Avatar.Image src={data.activeOrganization.logo} class="aspect-auto" />
		</Avatar.Root>
	{/if}
	<Card.Root class="w-full max-w-md shrink-0 ">
		<Card.Header class="w-full">
			<Card.Title>
				{data.activeOrganization?.name}
			</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if data.snappHasSecret}
				<form
					class="w-full h-full"
					{...trySecret.enhance(async ({ submit }) => {
						try {
							await submit();
						} catch (error) {
							console.error(error);
							toast.error(
								(error as { body?: { message?: string } })?.body?.message || m.errors_generic()
							);
						}
					})}
				>
					<input type="text" hidden name="urlId" value={data.urlId} />
					<Field.Field>
						<Field.Label for="_secret">{m.secret()}</Field.Label>
						<ButtonGroup>
							<InputGroup.InputGroup>
								<InputGroup.Addon><PrivacyIcon /></InputGroup.Addon>
								<InputGroup.Input
									id="_secret"
									placeholder={m.placeholders_auth_password()}
									{...trySecret.fields._secret.as(showPassword ? 'text' : 'password')}
								/>
							</InputGroup.InputGroup>
							<Button size="icon" onclick={() => (showPassword = !showPassword)}
								>{#if showPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
							>
						</ButtonGroup>
						{#each trySecret.fields._secret.issues() as issue (issue)}
							<Field.Error>{issue.message}</Field.Error>
						{:else}
							<Field.Description class="text-balance">{m.url_protected()}</Field.Description>
						{/each}
					</Field.Field>
					<Button type="submit" class="mt-4">{m.confirm()}</Button>
				</form>
			{:else}
				<div class="text-sm">{m.errors_url_disabled()}</div>
			{/if}
		</Card.Content>
	</Card.Root>
	<small class="font-semibold first-letter:uppercase"
		>{m.powered_by({ appname: data.appname })}</small
	>
</div>
