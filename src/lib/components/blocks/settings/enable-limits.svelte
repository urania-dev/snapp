<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';

	import * as Field from '$lib/components/ui/field';
	import { Switch } from '$lib/components/ui/switch';
	import { m } from '$lib/paraglide/messages';
	import { updateHostOptions } from '$lib/remotes/config.remote';
	import { toast } from 'svelte-sonner';
	const { host }: { host: THost } = $props();
</script>

<Field.Set class="w-full">
	<Field.Label for="disable-limits" class="min-h-24 w-full">
		<Field.Field orientation="horizontal" class="w-full">
			<Field.Content>
				<span>{m.control_enable_limits()}</span>
				<Field.Description class="max-w-xl @xl:text-xs text-balance">
					{m.control_enable_limits_helper()}
				</Field.Description>
			</Field.Content>
			<Switch
				name="disable-limits"
				id="disable-limits"
				checked={host.options.disable.limits === false}
				onCheckedChange={async (check) => {
					try {
						const updated = {
							...host,
							options: { ...host.options, disable: { ...host.options.disable, limits: !check } }
						};
						await updateHostOptions(updated);
						toast.success(m.settings_saved());
					} catch (error) {
						toast.error(m.errors_settings_saving());
						console.error('[config] Enable limits', error);
					}
				}}
			/>
		</Field.Field>
	</Field.Label>
</Field.Set>
