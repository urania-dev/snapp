<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';
	import type { FormEventHandler, MouseEventHandler } from 'svelte/elements';

	import GlobeIcon from '@lucide/svelte/icons/globe-2';
	import HashIcon from '@lucide/svelte/icons/hash';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { updateHostOptions } from '$lib/remotes/config.remote';
	import { toast } from 'svelte-sonner';
	import * as v from 'valibot';
	const { host }: { host: THost } = $props();
	let invalid = $state<Record<string, string | string[] | undefined> | undefined>();
	const isInvalid = (field: string) => {
		return invalid?.[field] !== undefined;
	};
	const parseInvalid = (key: string) => {
		return Array.isArray(invalid?.[key]) ? invalid[key].join('\n') : invalid?.[key];
	};
	// svelte-ignore state_referenced_locally
	let umamiURL = $state(host.thirdparty?.umami?.url);
	// svelte-ignore state_referenced_locally
	let umamiWID = $state(host.thirdparty?.umami?.websiteId);
	const saveUmamiSettings: FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		invalid = {};
		const formData = new FormData(e.currentTarget);
		const valid = v.safeParse(
			v.object({
				url: v.pipe(v.string(), v.url(m.errors_url_invalid())),
				websiteId: v.string()
			}),
			Object.fromEntries(formData.entries())
		);
		if (!valid.success) {
			console.error(valid.issues);
			invalid = v.flatten(valid.issues).nested;
			return;
		}
		try {
			const umami = valid.output;
			const update = {
				...host,
				thirdparty: { ...(host?.thirdparty || {}), umami }
			};
			await updateHostOptions(update);
			await invalidateAll();
			toast.success(m.settings_saved());
		} catch (error) {
			console.error('[umami] frontend option', error);
		}
	};
	const deleteUmamiSettings: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = async (
		e
	) => {
		invalid = {};
		e.preventDefault();
		try {
			const update = {
				...host,
				thirdparty: { ...(host?.thirdparty || {}), umami: undefined }
			};
			await updateHostOptions(update);
			toast.success(m.settings_saved());
			umamiURL = undefined;
			umamiWID = undefined;
			await invalidateAll();
		} catch (error) {
			console.error('[umami] frontend change options', error);
		}
	};
</script>

<Field.Set>
	<form class="contents" onsubmit={saveUmamiSettings}>
		<Field.Field data-invalid={isInvalid('url')}>
			<Field.Label for="url">{m.control_integrations_umami_url()}</Field.Label>
			<InputGroup.Root>
				<InputGroup.Addon align="inline-start" class="pe-0!"><GlobeIcon /></InputGroup.Addon>
				<InputGroup.Input
					placeholder="https://umami.is ..."
					name="url"
					bind:value={umamiURL}
					aria-invalid={isInvalid('url')}
				/>
			</InputGroup.Root>
			<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html m.control_integrations_umami_url_helper()}
			</Field.Description>
			<Field.Error>{parseInvalid('url')}</Field.Error>
		</Field.Field>
		<Field.Field data-invalid={isInvalid('websiteId')}>
			<Field.Label for="websiteId">{m.control_integrations_umami_wid()}</Field.Label>
			<InputGroup.Root>
				<InputGroup.Addon align="inline-start" class="pe-0!"><HashIcon /></InputGroup.Addon>
				<InputGroup.Input
					placeholder={m.control_integrations_umami_wid_placeholder()}
					name="websiteId"
					bind:value={umamiWID}
					aria-invalid={isInvalid('websiteId')}
				/>
			</InputGroup.Root>
			<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html m.control_integrations_umami_wid_helper()}
			</Field.Description>
			<Field.Error>{parseInvalid('websiteId')}</Field.Error>
		</Field.Field>
		<ButtonGroup>
			<Button
				size="sm"
				variant="outline"
				disabled={typeof host?.thirdparty?.umami?.websiteId !== 'string' &&
					typeof host?.thirdparty?.umami?.url !== 'string'}
				onclick={deleteUmamiSettings}>{m.delete()}</Button
			>
			<Button
				type="submit"
				size="sm"
				disabled={umamiURL === host?.thirdparty?.umami?.url &&
					umamiWID === host?.thirdparty?.umami?.websiteId}>{m.save_changes()}</Button
			>
		</ButtonGroup>
	</form>
</Field.Set>
