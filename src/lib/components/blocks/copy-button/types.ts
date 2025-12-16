import type { ButtonPropsWithoutHTML } from '$lib/components/blocks/button';
import type { UseClipboard } from '$lib/hooks/use-clipboard.svelte';
import type { WithChildren, WithoutChildren } from 'bits-ui';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
export type CopyButtonProps = CopyButtonPropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLButtonElement>>;
export type CopyButtonPropsWithoutHTML = WithChildren<
	{
		animationDuration?: number;
		icon?: Snippet<[]>;
		onCopy?: (status: UseClipboard['status']) => void;
		ref?: HTMLButtonElement | null;
		text: string;
	} & Pick<ButtonPropsWithoutHTML, 'size' | 'variant'>
>;
