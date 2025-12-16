import type { CopyButtonPropsWithoutHTML } from '$lib/components/blocks/copy-button/types';
import type { WithChildren, WithoutChildren } from 'bits-ui';
import type { HTMLAttributes } from 'svelte/elements';

import type { CodeVariant } from '.';
import type { SupportedLanguage } from './shiki';
export type CodeCopyButtonProps = CodeCopyButtonPropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLButtonElement>>;
export type CodeCopyButtonPropsWithoutHTML = Omit<CopyButtonPropsWithoutHTML, 'text'>;
export type CodeOverflowProps = CodeOverflowPropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLDivElement>>;
export type CodeOverflowPropsWithoutHTML = WithChildren<{
	collapsed?: boolean;
}>;
export type CodeRootProps = CodeRootPropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLDivElement>>;
export type CodeRootPropsWithoutHTML = WithChildren<{
	class?: string;
	code: string;
	hideLines?: boolean;
	highlight?: ([number, number] | number)[];
	lang?: SupportedLanguage;
	ref?: HTMLDivElement | null;
	variant?: CodeVariant;
}>;
