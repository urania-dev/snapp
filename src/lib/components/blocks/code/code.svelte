<script lang="ts">
	import { cn } from '$lib/utils';
	import { box } from 'svelte-toolbelt';

	import type { CodeRootProps } from './types';

	import { codeVariants } from '.';
	import { useCode } from './code.svelte.ts';

	let {
		children,
		class: className,
		code,
		hideLines = false,
		highlight = [],
		lang = 'typescript',
		ref = $bindable(null),
		variant = 'default',
		...rest
	}: CodeRootProps = $props();
	const codeState = useCode({
		code: box.with(() => code),
		hideLines: box.with(() => hideLines),
		highlight: box.with(() => highlight),
		lang: box.with(() => lang)
	});
</script>

<div {...rest} bind:this={ref} class={cn(codeVariants({ variant }), className)}>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html codeState.highlighted}
	{@render children?.()}
</div>

<style>
	:global(.dark .shiki span),
	:global(.dark .shiki) {
		color: var(--shiki-dark) !important;
		font-style: var(--shiki-dark-font-style) !important;
		font-weight: var(--shiki-dark-font-weight) !important;
		text-decoration: var(--shiki-dark-text-decoration) !important;
	}
	/* Shiki see: https://shiki.matsu.io/guide/dual-themes#class-based-dark-mode */
	:global(html.dark .shiki span),
	:global(html.dark .shiki) {
		color: var(--shiki-dark) !important;
		font-style: var(--shiki-dark-font-style) !important;
		font-weight: var(--shiki-dark-font-weight) !important;
		text-decoration: var(--shiki-dark-text-decoration) !important;
	}
	:global(pre.shiki) {
		overflow-x: auto;
		border-radius: var(--radius-lg);
		background: inherit;
		padding-block: 16px;
		font-size: var(--text-sm);
	}
	:global(pre.shiki:not([data-code-overflow] *):not([data-code-overflow])) {
		overflow-y: auto;
		max-height: min(100%, 650px);
	}
	:global(pre.shiki code) {
		display: grid;
		min-width: 100%;
		border-radius: none;
		border: none;
		background: transparent;
		padding: 0;
		overflow-wrap: break-words;
		counter-reset: line;
		box-decoration-break: clone;
	}
	:global(pre.line-numbers) {
		counter-reset: step;
		counter-increment: step 0;
	}
	:global(pre.line-numbers .line::before) {
		content: counter(step);
		counter-increment: step;
		display: inline-block;
		width: 1.8rem;
		margin-right: 1.4rem;
		text-align: right;
	}
	:global(pre.line-numbers .line::before) {
		color: var(--muted-foreground);
	}
	:global(pre .line.line--highlighted) {
		background: var(--bg-foreground);
	}
	:global(pre .line.line--highlighted span) {
		position: relative;
	}
	:global(pre .line) {
		display: inline-block;
		min-height: 16px;
		width: 100%;
		padding: 2px 16px;
	}
	:global(pre.line-numbers .line) {
		padding-inline: 2px;
	}
</style>
