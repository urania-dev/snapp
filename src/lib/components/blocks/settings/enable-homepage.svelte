<script lang="ts">
	import type { FormEventHandler } from 'svelte/elements';

	import TrendingUpDownIcon from '@lucide/svelte/icons/trending-up-down';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Switch } from '$lib/components/ui/switch';
	import { m } from '$lib/paraglide/messages';
	import { updateHostOptions } from '$lib/remotes/config.remote';
	import { HostSchema, type THost } from '$lib/schemas/host.schema';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';
	import * as v from 'valibot';
	const { host }: { host: THost } = $props();
	const changeCustomLink: FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const valid = v.safeParse(
			HostSchema.entries.options.entries.customRedirect,
			formData.get('customurl')?.toString()
		);
		if (!valid.success) {
			console.error(valid.issues);
			return;
		}
		try {
			const customRedirect = valid.output?.trim() ? valid.output : undefined;
			await updateHostOptions({
				...host,
				options: { ...host.options, customRedirect }
			});
			toast.success(m.settings_saved());
			await invalidateAll();
		} catch (error) {
			console.error('[config] disable home FE', error);
		}
	};
	let customRedirect = $derived(host.options.customRedirect);
</script>

<Field.Set class="min-h-24 w-full gap-4">
	<Field.Label for="disable-homepage" class="grow">
		<Field.Field orientation="horizontal" class="h-full">
			<Field.Content>
				<span>{m.control_enable_homepage()}</span>
				<Field.Description class="max-w-xl @xl:text-xs text-balance">
					{m.control_enable_homepage_helper()}
				</Field.Description>
			</Field.Content>
			<Switch
				name="disable-homepage"
				id="disable-homepage"
				checked={host.options.disable.homepage === true}
				onCheckedChange={async (check) => {
					try {
						const updated = {
							...host,
							options: { ...host.options, disable: { ...host.options.disable, homepage: check } }
						};
						await updateHostOptions(updated);
						toast.success(m.settings_saved());
						await invalidateAll();
					} catch (error) {
						toast.error(m.errors_settings_saving());
						console.error('[config] Disable homepage FE', error);
					}
				}}
			/>
		</Field.Field>
	</Field.Label>
	{#if host.options.disable.homepage === true}
		<form onsubmit={changeCustomLink} class="w-full" in:fly|global={{ y: 12 }}>
			<Field.Set class="min-h-[120px] w-full overflow-hidden border border-border py-4">
				<Field.Field orientation="vertical" class="px-4">
					<Field.Label>{m.control_enable_homepage_url()}</Field.Label>
					<ButtonGroup>
						<InputGroup.Root>
							<InputGroup.Addon align="inline-start"><TrendingUpDownIcon /></InputGroup.Addon>
							<InputGroup.Input
								name="customurl"
								placeholder={m.control_enable_homepage_url_placeholder()}
								type="text"
								bind:value={customRedirect}
							/>
						</InputGroup.Root>
						<Button
							type="submit"
							variant="outline"
							disabled={host.options.customRedirect === customRedirect}>{m.save_changes()}</Button
						>
					</ButtonGroup>
					<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
						{m.control_enable_homepage_url_helper()}
					</Field.Description>
				</Field.Field>
			</Field.Set>
		</form>
	{/if}
</Field.Set>
