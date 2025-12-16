import { tv, type VariantProps } from 'tailwind-variants';

import type { CodeCopyButtonProps, CodeRootProps } from './types';

import CopyButton from './code-copy-button.svelte';
import Overflow from './code-overflow.svelte';
import Root from './code.svelte';
export const codeVariants = tv({
	base: 'not-prose relative h-full overflow-auto rounded-lg border',
	variants: {
		variant: {
			default: 'border-border bg-card',
			secondary: 'bg-secondary/50 border-transparent'
		}
	}
});
export type CodeVariant = VariantProps<typeof codeVariants>['variant'];
export {
	CopyButton,
	type CodeCopyButtonProps as CopyButtonProps,
	Overflow,
	Root,
	type CodeRootProps as RootProps
};
