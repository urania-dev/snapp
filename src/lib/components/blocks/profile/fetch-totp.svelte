<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeClosedIcon from '@lucide/svelte/icons/eye-closed';
	import KeyIcon from '@lucide/svelte/icons/key-round';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { fetchTotp } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';
	type TwoFactorFormProps = {
		backupCodes?: string[];
		hideDialog?: boolean;
		qrCode?: string;
		totpURI?: string;
	};
	let {
		backupCodes = $bindable(),
		hideDialog = false,
		qrCode = $bindable(),
		totpURI = $bindable()
	}: TwoFactorFormProps = $props();
	let showPassword = $state(false);
</script>

<form
	id="form-2fa"
	class="flex w-full max-w-lg grow flex-col gap-4"
	{...fetchTotp.enhance(async ({ submit }) => {
		try {
			await submit();
			if (fetchTotp.result?.totpURI) {
				({ backupCodes, totpURI } = fetchTotp.result);
			}
		} catch (error) {
			console.error(error);
			const err =
				(error as { body?: { message?: string } })?.body?.message || m.errors_saving_profile();
			toast.error(err);
		}
	})}
>
	{#if !hideDialog}
		<Field.Label>{m.two_factor_helper()}</Field.Label>
	{/if}
	<Field.Field data-invalid={Array.isArray(fetchTotp.fields._password.issues())}>
		<Field.Label for="Password">{m.password()}</Field.Label>
		<ButtonGroup>
			<InputGroup.Root>
				<InputGroup.Addon><KeyIcon class="size-5!" /></InputGroup.Addon>
				<InputGroup.Input
					id="Password"
					placeholder={m.placeholders_auth_password()}
					{...fetchTotp.fields._password.as(showPassword ? 'text' : 'password')}
				/>
			</InputGroup.Root>
			<Button size="icon" onclick={() => (showPassword = !showPassword)}
				>{#if showPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
			>
		</ButtonGroup>
		{#each fetchTotp.fields._password.issues() as issue (issue)}
			<Field.Error>{issue.message}</Field.Error>
		{:else}
			<Field.Description>{m.two_factor_helper_password()}</Field.Description>
		{/each}
	</Field.Field>
	<Button type="submit" class="mt-2 max-w-max">{m.confirm()}</Button>
</form>
