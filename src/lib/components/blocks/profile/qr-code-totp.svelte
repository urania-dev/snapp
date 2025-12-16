<script lang="ts">
	import TextFileIcon from '@lucide/svelte/icons/file-text';
	import ImageIcon from '@lucide/svelte/icons/image';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import Label from '$lib/components/ui/label/label.svelte';
	import { m } from '$lib/paraglide/messages';
	import { renderSVG } from 'uqr';
	type TwoFactorFormProps = {
		backupCodes: string[];
		hideDialog?: boolean;
		showOTPTest: boolean;
		totpURI?: null | string;
	};
	let {
		backupCodes = $bindable(),
		hideDialog = false,
		showOTPTest = $bindable(),
		totpURI = $bindable()
	}: TwoFactorFormProps = $props();
	const qrCode = renderSVG(totpURI || '');
</script>

{#if !hideDialog}
	<Label>{m.two_factor_only_once()}</Label>
{/if}
<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<div class="aspect-square h-full w-full max-w-sm">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html qrCode}
	</div>
	<div
		class="grid h-full w-full grid-cols-1"
		style:grid-template-rows="max-content auto max-content"
	>
		<ButtonGroup class="h-10 max-h-10 w-full">
			<InputGroup.Root class="w-full">
				<InputGroup.Text class="w-full px-2">
					{m.download()}
				</InputGroup.Text>
			</InputGroup.Root>
			<Button
				variant="outline"
				size="icon"
				onclick={() => {
					if (!totpURI || !qrCode) return;
					var link = document.createElement('a');
					link.setAttribute(
						'href',
						'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrCode)
					);
					link.setAttribute('download', 'totpURI.svg');
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
				}}
			>
				<ImageIcon />
			</Button>
			<Button
				variant="outline"
				size="icon"
				onclick={() => {
					if (!totpURI) return;
					var link = document.createElement('a');
					link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(totpURI));
					link.setAttribute('download', 'totpURI.txt');
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
				}}
			>
				<TextFileIcon />
			</Button>
		</ButtonGroup>
		<Field.Field class="mt-2">
			<Field.Label>{m.two_factor_label_backup_codes()}</Field.Label>
			<Button
				variant="outline"
				onclick={() => {
					if (!totpURI) return;
					var link = document.createElement('a');
					link.setAttribute(
						'href',
						'data:text/plain;charset=utf-8,' + encodeURIComponent(backupCodes.join('\n'))
					);
					link.setAttribute('download', 'backupCodes.txt');
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
				}}>{m.download()}</Button
			>
			<Field.Description class="@xl:text-xs">{m.two_factor_helper_backup_codes()}</Field.Description
			>
		</Field.Field>
		<Button
			class="mt-auto"
			onclick={async () => {
				showOTPTest = true;
			}}>{m.confirm()}</Button
		>
	</div>
</div>
