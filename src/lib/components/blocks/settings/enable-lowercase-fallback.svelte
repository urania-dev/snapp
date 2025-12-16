<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as Field from '$lib/components/ui/field';
	import { Switch } from '$lib/components/ui/switch';
	import { m } from '$lib/paraglide/messages';
	import { updateHostOptions } from '$lib/remotes/config.remote';
	import { type THost } from '$lib/schemas/host.schema';
	import { toast } from 'svelte-sonner';
	const { host }: { host: THost } = $props();
</script>

<Field.Set class="min-h-20 w-full gap-4">
	<Field.Label for="enable-lowercase-fallback" class="grow">
		<Field.Field orientation="horizontal" class="h-full">
			<Field.Content>
				<span>{m.control_enable_lowercase_fallback()}</span>
				<Field.Description class="max-w-xl @xl:text-xs text-balance">
					{m.control_enable_lowercase_fallback_helper()}
				</Field.Description>
			</Field.Content>
			<Switch
				name="enable-lowercase-fallback"
				id="enable-lowercase-fallback"
				checked={host.options.disable.lowerCaseFallback === false}
				onCheckedChange={async (check) => {
					try {
						const updated = {
							...host,
							options: {
								...host.options,
								disable: { ...host.options.disable, lowerCaseFallback: !check }
							}
						};
						await updateHostOptions(updated);
						toast.success(m.settings_saved());
						await invalidateAll();
					} catch (error) {
						toast.error(m.errors_settings_saving());
						console.error('[config] Disable lowercaseFallback FE', error);
					}
				}}
			/>
		</Field.Field>
	</Field.Label>
</Field.Set>
