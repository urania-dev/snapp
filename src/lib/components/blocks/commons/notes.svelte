<script lang="ts">
	import type { FormEventHandler } from 'svelte/elements';

	import CheckMarkIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TextCursorInputIcon from '@lucide/svelte/icons/text-cursor-input';
	import * as InputGroup from '$lib/components/ui/input-group/index';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { toast } from 'svelte-sonner';
	let {
		notes = $bindable(),
		placeholder = m.users_placeholders_notes(),
		readonly
	}: { notes?: string; placeholder?: string; readonly?: boolean } = $props();
	let copied = $state(false);
	$effect(() => {
		if (copied) {
			setTimeout(() => {
				copied = false;
			}, 200);
		}
	});
	let line = $state(0);
	let column = $state(0);
	const handleCursor: FormEventHandler<HTMLTextAreaElement> = (e) => {
		showCursor = true;
		const textarea = e.currentTarget;
		const pos = textarea.selectionStart;
		const textBeforeCursor = textarea.value.slice(0, pos);
		const lines = textBeforeCursor.split('\n');
		line = lines.length;
		column = lines[lines.length - 1].length + 1;
	};
	let showCursor = $state(false);
	const cleanCursor = () => {
		line = 0;
		column = 0;
		showCursor = false;
	};
	let invalid = $state<Record<string, string | string[] | undefined> | undefined>();
	const isInvalid = (field: string) => {
		return invalid?.[field] !== undefined;
	};
</script>

<div class="grid w-full grow gap-4">
	<InputGroup.Root>
		<InputGroup.Addon align="block-start" class="border-b">
			<InputGroup.Text class="font-medium">
				{m.notes()}
			</InputGroup.Text>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<InputGroup.Button {...props} class="ms-auto rounded-full" size="icon-xs">
							<InfoIcon />
						</InputGroup.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content align="end">{m.admin_notes_helper()}</Tooltip.Content>
			</Tooltip.Root>
			<InputGroup.Button
				variant="ghost"
				size="icon-xs"
				onclick={() => {
					try {
						navigator.clipboard.writeText(notes || '');
						toast.success(m.copied());
					} catch (error) {
						console.error(error);
						toast.error(m.copy_failed());
					}
				}}
			>
				{#if copied}
					<CheckMarkIcon />
				{:else}
					<CopyIcon />
				{/if}
			</InputGroup.Button>
		</InputGroup.Addon>
		<InputGroup.Textarea
			aria-invalid={isInvalid('notes')}
			onblur={cleanCursor}
			onchange={handleCursor}
			onkeydown={handleCursor}
			onfocus={handleCursor}
			onclick={handleCursor}
			{placeholder}
			bind:value={notes}
			readonly={readonly ? true : undefined}
			class="h-full min-h-[200px]"
			name="notes"
		/>
		<InputGroup.Addon align="block-end" class="w-full justify-between border-t">
			<InputGroup.Text
				><TextCursorInputIcon />{#if showCursor}<span class="font-mono">[ {line}, {column} ]</span
					>{/if}</InputGroup.Text
			>
		</InputGroup.Addon>
	</InputGroup.Root>
</div>
