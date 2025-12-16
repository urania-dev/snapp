<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as Field from '$lib/components/ui/field';
	import { Switch } from '$lib/components/ui/switch';
	import { m } from '$lib/paraglide/messages';
	import { getSMTPInfo, updateSMTPOptions } from '$lib/remotes/config.remote';
	import { toast } from 'svelte-sonner';
	const {
		smtp
	}: {
		smtp: {
			enabled: boolean;
		};
	} = $props();
</script>

<Field.Set class="min-h-20 w-full shrink-0 border-border py-0">
	<Field.Label for="disable-smtp" class="min-h-20">
		<Field.Field orientation="horizontal" class="min-h-20">
			<Field.Content>
				<span>{m.control_smtp_enable()}</span>
				<Field.Description class="max-w-xl @xl:text-xs text-balance">
					{m.control_smtp_enable_helper()}
				</Field.Description>
			</Field.Content>
			<Switch
				name="disable-smtp"
				id="disable-smtp"
				checked={smtp?.enabled === true}
				onCheckedChange={async (check) => {
					try {
						const updated = {
							...smtp,
							enabled: check
						};
						await updateSMTPOptions(updated).updates(getSMTPInfo().withOverride(() => updated));
						toast.success(m.settings_saved());
						await invalidateAll();
					} catch (error) {
						toast.error(m.errors_settings_saving());
						console.error('[smtp] enable option', error);
					}
				}}
			/>
		</Field.Field>
	</Field.Label>
</Field.Set>
