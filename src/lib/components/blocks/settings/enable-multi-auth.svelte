<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as Field from '$lib/components/ui/field';
	import { Switch } from '$lib/components/ui/switch';
	import { m } from '$lib/paraglide/messages';
	import { updateHostOptions } from '$lib/remotes/config.remote';
	import { type THost } from '$lib/schemas/host.schema';
	import { toast } from 'svelte-sonner';
	const { host }: { host: THost } = $props();
	const active = $derived(host.options.disable.twoFactor === false);
</script>

<Field.Set class="min-h-20 w-full gap-4">
	<Field.Label for="disable-2fa" class="grow">
		<Field.Field orientation="horizontal" class="h-full">
			<Field.Content>
				<span>{m.control_enable_mfa()}</span>
				<Field.Description class="max-w-xl @xl:text-xs text-balance">
					{m.control_enable_mfa_helper()}
				</Field.Description>
			</Field.Content>
			<Switch
				name="disable-2fa"
				id="disable-2fa"
				checked={active}
				onCheckedChange={async (check) => {
					try {
						const updated = {
							...host,
							options: { ...host.options, disable: { ...host.options.disable, twoFactor: !check } }
						};
						await updateHostOptions(updated);
						toast.success(m.settings_saved());
						await invalidateAll();
					} catch (error) {
						toast.error(m.errors_settings_saving());
						console.error('[config] Disable twoFactor FE', error);
					}
				}}
			/>
		</Field.Field>
	</Field.Label>
</Field.Set>
