<script lang="ts">
	import type { FormEventHandler, MouseEventHandler } from 'svelte/elements';
	import Icon from './icon.svelte';
	import { cn } from '$lib/svelte-sonner/internal';
	import type { DateValue } from '@internationalized/date';

	let {
		name,
		label,
		type = 'text',
		icons,
		actions,
		disabled,
		css,
		value = $bindable(),
		element = $bindable(),
		date = $bindable(),
		placeholder
	}: {
		name: string;
		label?: string;
		type?: HTMLInputElement['type'];
		icons?: { left?: string; right?: string };
		actions?: {
			left?: MouseEventHandler<HTMLButtonElement>;
			right?: MouseEventHandler<HTMLButtonElement>;
			focus?: FormEventHandler<HTMLInputElement | HTMLTextAreaElement>;
			blur?: FormEventHandler<HTMLInputElement | HTMLTextAreaElement>;
			change?: FormEventHandler<HTMLInputElement | HTMLTextAreaElement>;
			input?: FormEventHandler<HTMLInputElement | HTMLTextAreaElement>;
		};
		css?: { [key: string]: string };
		placeholder?: string;
		value?: any;
		date?: DateValue | null;
		element?: HTMLInputElement | HTMLTextAreaElement;
		disabled?: boolean;
	} = $props();
</script>

<label for={name} class={cn('flex w-full flex-col gap-2', css?.['field'])}>
	<span class={cn('px-1 text-left text-sm font-semibold tracking-wider w-full', css?.['label'])}
		>{label}</span
	>
	<div
		class={cn(
			'group flex items-center gap-0 rounded border border-slate-500/50 focus-within:border-pink-500 focus-within:border-slate-500/75',
			type === 'textarea' ? 'h-full' : 'min-h-10',
			css?.['group']
		)}
	>
		{#if icons?.left}
			<button
				tabindex="-1"
				class="flex w-full max-w-max items-center gap-2 px-2"
				onclick={(e) => actions?.left?.(e) || element?.focus()}
			>
				<Icon ph={icons.left} css={css ? { icon: css?.['icon-left'] } : undefined}></Icon>
			</button>
		{/if}
		{#if type !== 'textarea' && type !== 'date'}
			<input
				bind:this={element}
				{name}
				{placeholder}
				{disabled}
				class={cn(
					'flex h-full w-full items-center border-0 border-none border-transparent bg-transparent px-2 text-sm outline-none placeholder:text-sm',
					css?.['input']
				)}
				onchange={(e) => actions?.change?.(e)}
				oninput={(e) => actions?.input?.(e)}
				onblur={(e) => actions?.blur?.(e)}
				onfocus={(e) => actions?.focus?.(e)}
				id={name}
				style:appearance="textfield"
				bind:value
				{type}
			/>
		{/if}
		{#if type === 'textarea'}
			<textarea
				bind:this={element}
				{name}
				{placeholder}
				{disabled}
				class={cn(
					'flex h-full w-full resize-none border-0 border-none border-transparent bg-transparent p-2 text-sm outline-none placeholder:text-sm',
					css?.['input']
				)}
				onchange={(e) => actions?.change?.(e)}
				oninput={(e) => actions?.input?.(e)}
				onblur={(e) => actions?.blur?.(e)}
				onfocus={(e) => actions?.focus?.(e)}
				id={name}
				bind:value>{value}</textarea
			>
		{/if}
		{#if type === 'date'}
			<input
				bind:this={element}
				{name}
				{placeholder}
				{disabled}
				class={cn(
					'flex h-full w-full items-center border-0 border-none border-transparent bg-transparent px-2 outline-none placeholder:text-sm',
					css?.['input']
				)}
				onchange={(e) => actions?.change?.(e)}
				oninput={(e) => actions?.input?.(e)}
				onblur={(e) => actions?.blur?.(e)}
				onfocus={(e) => actions?.focus?.(e)}
				id={name}
				style:appearance="textfield"
				bind:value={date}
				type="date"
			/>
		{/if}
		{#if icons?.right}
			<button
				tabindex="-1"
				class="flex w-full max-w-max items-center gap-2 p-2"
				onclick={(e) => actions?.right?.(e)}
			>
				<Icon ph={icons.right} css={css ? { icon: css?.['icon-right'] } : undefined}></Icon>
			</button>
		{/if}
	</div>
</label>

<style>
	input:-webkit-autofill,
	input:-webkit-autofill:hover,
	input:-webkit-autofill:focus,
	input:-webkit-autofill:active {
		-webkit-box-shadow: 0 0 0 30px #ebedef inset !important;
		-webkit-text-fill-color: #09363d !important;
	}
	:global(html.dark input):-webkit-autofill,
	:global(html.dark input):-webkit-autofill:hover,
	:global(html.dark input):-webkit-autofill:focus,
	:global(html.dark input):-webkit-autofill:active {
		-webkit-box-shadow: 0 0 0 30px #121416 inset !important;
		-webkit-text-fill-color: white !important;
	}
</style>
