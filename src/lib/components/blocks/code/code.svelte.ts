import type { HighlighterCore } from 'shiki';
import type { ReadableBoxedValues, WritableBoxedValues } from 'svelte-toolbelt';

import DOMPurify from 'isomorphic-dompurify';
import { Context } from 'runed';

import type { CodeRootProps } from './types';

import { highlighter } from './shiki';
type CodeOverflowStateProps = WritableBoxedValues<{
	collapsed: boolean;
}>;
type CodeRootStateProps = ReadableBoxedValues<{
	code: string;
	hideLines: boolean;
	highlight: CodeRootProps['highlight'];
	lang: NonNullable<CodeRootProps['lang']>;
}>;
class CodeCopyButtonState {
	get code() {
		return this.root.opts.code.current;
	}
	constructor(readonly root: CodeRootState) {}
}
class CodeOverflowState {
	get collapsed() {
		return this.opts.collapsed.current;
	}
	constructor(readonly opts: CodeOverflowStateProps) {
		this.toggleCollapsed = this.toggleCollapsed.bind(this);
	}
	toggleCollapsed() {
		this.opts.collapsed.current = !this.opts.collapsed.current;
	}
}
class CodeRootState {
	highlighted = $derived(DOMPurify.sanitize(this.highlight(this.code) ?? ''));
	highlighter: HighlighterCore | null = $state(null);
	get code() {
		return this.opts.code.current;
	}
	constructor(
		readonly opts: CodeRootStateProps,
		readonly overflow?: CodeOverflowState
	) {
		highlighter.then((hl) => (this.highlighter = hl));
	}
	highlight(code: string) {
		return this.highlighter?.codeToHtml(code, {
			lang: this.opts.lang.current,
			themes: {
				dark: 'nord',
				light: 'min-light'
			},
			transformers: [
				{
					line: (node, line) => {
						if (within(line, this.opts.highlight.current)) {
							node.properties.class = node.properties.class + ' line--highlighted';
						}
						return node;
					},
					pre: (el) => {
						el.properties.style = '';
						if (!this.opts.hideLines.current) {
							el.properties.class += ' line-numbers';
						}
						return el;
					}
				}
			]
		});
	}
}
function within(num: number, range: CodeRootProps['highlight']) {
	if (!range) return false;
	let within = false;
	for (const r of range) {
		if (typeof r === 'number') {
			if (num === r) {
				within = true;
				break;
			}
			continue;
		}
		if (r[0] <= num && num <= r[1]) {
			within = true;
			break;
		}
	}
	return within;
}
const overflowCtx = new Context<CodeOverflowState>('code-overflow-state');
const ctx = new Context<CodeRootState>('code-root-state');
export function useCode(props: CodeRootStateProps) {
	return ctx.set(new CodeRootState(props, overflowCtx.getOr(undefined)));
}
export function useCodeCopyButton() {
	return new CodeCopyButtonState(ctx.get());
}
export function useCodeOverflow(props: CodeOverflowStateProps) {
	return overflowCtx.set(new CodeOverflowState(props));
}
