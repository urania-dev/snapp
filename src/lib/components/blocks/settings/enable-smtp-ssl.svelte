<script lang="ts">
	import * as Field from '$lib/components/ui/field';
	import { Switch } from '$lib/components/ui/switch';
	import { m } from '$lib/paraglide/messages';
	import { getSMTPInfo, updateSMTPOptions } from '$lib/remotes/config.remote';
	import { toast } from 'svelte-sonner';
	type SMTP = {
		enabled: boolean;
		from?: string;
		host?: string;
		pass?: string;
		port?: number;
		secure?: boolean;
		user?: string;
	};
	// eslint-disable-next-line svelte/no-unused-props
	const {
		smtp
	}: {
		smtp: SMTP;
	} = $props();
</script>

<Field.Set class="w-full shrink-0 border-border py-0">
	<Field.Label for="disable-smtp-secure" class="min-h-24">
		<Field.Field orientation="horizontal">
			<Field.Content>
				<span>{m.control_smtp_secure()}</span>
				<Field.Description class="max-w-xl @xl:text-xs text-balance">
					{m.control_smtp_secure_helper()}
				</Field.Description>
			</Field.Content>
			<Switch
				name="disable-smtp-secure"
				id="disable-smtp-secure"
				disabled={smtp?.enabled !== true}
				checked={smtp?.secure === true}
				onCheckedChange={async (check) => {
					try {
						const updated = {
							...smtp,
							options: {
								...smtp,
								secure: check
							}
						};
						await updateSMTPOptions(updated).updates(
							getSMTPInfo().withOverride(() => ({ ...smtp, secure: check }))
						);
						toast.success(m.settings_saved());
					} catch (error) {
						toast.error(m.errors_settings_saving());
						console.error('[smtp] update ssl options', error);
					}
				}}
			/>
		</Field.Field>
	</Field.Label>
</Field.Set>
