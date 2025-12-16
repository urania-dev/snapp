<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';

	import { invalidateAll } from '$app/navigation';
	import * as Field from '$lib/components/ui/field';
	import { Switch } from '$lib/components/ui/switch';
	import { m } from '$lib/paraglide/messages';
	import { updateHostOptions } from '$lib/remotes/config.remote';
	import { toast } from 'svelte-sonner';
	const { host }: { host: THost } = $props();
</script>

<Field.Set class="min-h-24 w-full">
	<Field.Label for="disable-signup" class="min-h-24">
		<Field.Field orientation="horizontal" class="h-full">
			<Field.Content>
				<span>{m.control_enable_signup()}</span>
				<Field.Description class="max-w-xl @xl:text-xs text-balance">
					{m.control_enable_signup_helper()}
				</Field.Description>
			</Field.Content>
			<Switch
				name="disable-signup"
				id="disable-signup"
				checked={host.options.disable.signup !== true}
				onCheckedChange={async (check) => {
					try {
						const updated = {
							...host,
							options: { ...host.options, disable: { ...host.options.disable, signup: !check } }
						};
						await updateHostOptions(updated);
						toast.success(m.settings_saved());
						await invalidateAll();
					} catch (error) {
						toast.error(m.errors_settings_saving());
						console.error('[config] Enable SMTP', error);
					}
				}}
			/>
		</Field.Field>
	</Field.Label>
</Field.Set>
