<script lang="ts">
	import EyeClosedIcon from '@lucide/svelte/icons/eye';
	import EyeIcon from '@lucide/svelte/icons/eye-closed';
	import KeyIcon from '@lucide/svelte/icons/key-round';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { disableTotp } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';

	import Dialog from '../commons/dialog.svelte';
	type TwoFactorFormProps = {
		checked: boolean;
		open: boolean;
		user: User;
	};
	let { checked = $bindable(), open = $bindable(), user }: TwoFactorFormProps = $props();
	let showPassword = $state(false);
</script>

<Dialog description="" bind:open title={m.ask_sure()}>
	<form
		{...disableTotp.enhance(async ({ submit }) => {
			try {
				await submit();
				open = false;
				checked = user?.twoFactorEnabled || false;
			} catch (error) {
				console.error(error);
				toast.error(m.errors_saving_profile());
			}
			await invalidateAll();
		})}
		class="flex w-full max-w-lg grow flex-col gap-4"
	>
		<Field.Field data-invalid={Array.isArray(disableTotp.fields._password.issues())}>
			<Field.Label for="Password">{m.password()}</Field.Label>
			<ButtonGroup>
				<InputGroup.Root>
					<InputGroup.Addon><KeyIcon class="size-5!" /></InputGroup.Addon>
					<InputGroup.Input
						id="Password"
						placeholder={m.placeholders_auth_password()}
						{...disableTotp.fields._password.as(showPassword ? 'text' : 'password')}
					/>
				</InputGroup.Root>
				<Button size="icon" onclick={() => (showPassword = !showPassword)}
					>{#if showPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
				>
			</ButtonGroup>
			{#each disableTotp.fields._password.issues() as issue (issue)}
				<Field.Error>{issue.message}</Field.Error>
			{:else}
				<Field.Description>{m.two_factor_helper_password()}</Field.Description>
			{/each}
		</Field.Field>
		<ButtonGroup>
			<Button
				variant="outline"
				onclick={async () => {
					open = false;
					checked = user?.twoFactorEnabled || false;
				}}>{m.cancel()}</Button
			>
			<Button type="submit">{m.confirm()}</Button>
		</ButtonGroup>
	</form>
</Dialog>
