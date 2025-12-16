<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';
	import type { FormEventHandler, MouseEventHandler } from 'svelte/elements';

	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeClosedIcon from '@lucide/svelte/icons/eye-closed';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { updateHostOptions } from '$lib/remotes/config.remote';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';
	import * as v from 'valibot';
	let invalid = $state<Record<string, string | string[] | undefined> | undefined>();
	const isInvalid = (field: string) => {
		return invalid?.[field] !== undefined;
	};
	const parseInvalid = (key: string) => {
		return Array.isArray(invalid?.[key]) ? invalid[key].join('\n') : invalid?.[key];
	};
	const { host }: { host: THost } = $props();
	let showPass = $state(false);
	const changeApiKey: FormEventHandler<HTMLFormElement> = async (e) => {
		invalid = {};
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const valid = v.safeParse(v.pipe(v.string(), v.trim()), formData.get('apikey')?.toString());
		if (!valid.success) {
			console.error(valid.issues);
			invalid = { apikey: valid.issues[0].message };
			return;
		}
		try {
			const apikey = valid.output;
			const update = {
				...host,
				thirdparty: { ...(host?.thirdparty || {}), vtapi: { apikey } }
			};
			await updateHostOptions(update);
			toast.success(m.settings_saved());
			await invalidateAll();
		} catch (error) {
			console.error('[vtapi] frontend config', error);
		}
	};
	// svelte-ignore state_referenced_locally
	let vtapikey = $state(host.thirdparty?.vtapi?.apikey);
	const deleteApiKey: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = async (e) => {
		e.preventDefault();
		invalid = {};
		try {
			const update = {
				...host,
				thirdparty: { ...(host?.thirdparty || {}), vtapi: undefined }
			};
			await updateHostOptions(update);
			toast.success(m.settings_saved());
			vtapikey = undefined;
			await invalidateAll();
		} catch (error) {
			console.error('[vtapi] frontend config', error);
		}
	};
</script>

<form onsubmit={changeApiKey} class="w-full" in:fly|global={{ y: 12 }}>
	<Field.Set>
		<Field.Field data-invalid={isInvalid('apikey')}>
			<Field.Label for="apikey">{m.api_key()}</Field.Label>
			<ButtonGroup>
				<InputGroup.Root>
					<InputGroup.Addon align="inline-start" class="pe-0!"><KeyRoundIcon /></InputGroup.Addon>
					<InputGroup.Input
						placeholder={m.control_integrations_vtapi_apikey_placeholder()}
						name="apikey"
						type={showPass ? 'text' : 'password'}
						aria-invalid={isInvalid('apikey')}
						bind:value={vtapikey}
					/>
				</InputGroup.Root>
				<Button
					size="icon"
					variant={isInvalid('apikey') ? 'destructive' : 'outline'}
					onclick={() => (showPass = !showPass)}
					tabindex={-1}
				>
					{#if showPass}
						<EyeIcon />
					{:else}
						<EyeClosedIcon />
					{/if}
				</Button>
			</ButtonGroup>
			<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html m.control_integrations_vtapi_apikey_helper()}
			</Field.Description>
			<Field.Error>{parseInvalid('apikey')}</Field.Error>
		</Field.Field>
		<ButtonGroup>
			<Button
				size="sm"
				variant="outline"
				disabled={typeof host.thirdparty?.vtapi?.apikey !== 'string'}
				onclick={deleteApiKey}>{m.delete()}</Button
			>
			<Button type="submit" size="sm" disabled={vtapikey === host.thirdparty?.vtapi?.apikey}
				>{m.save_changes()}</Button
			>
		</ButtonGroup>
	</Field.Set>
</form>
