import type {
	AvatarRootProps,
	DialogContentProps,
	WithChildren,
	WithoutChild,
	WithoutChildren
} from 'bits-ui';
import type { Snippet } from 'svelte';
import type { CropperProps } from 'svelte-easy-crop';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
export type ImageCropperControlsProps = ImageCropperControlsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLDivElement>>;
export type ImageCropperControlsWithoutHTML = WithChildren<{
	ref?: HTMLDivElement | null;
}>;
export type ImageCropperCropperProps = Omit<Partial<CropperProps>, 'image' | 'oncropcomplete'>;
export type ImageCropperDialogProps = DialogContentProps;
export type ImageCropperPreviewProps = ImageCropperPreviewPropsWithoutHTML &
	WithoutChild<AvatarRootProps>;
export type ImageCropperPreviewPropsWithoutHTML = {
	child?: Snippet<[{ src: string }]>;
};
export type ImageCropperRootProps = HTMLInputAttributes & ImageCropperRootPropsWithoutHTML;
export type ImageCropperRootPropsWithoutHTML = WithChildren<{
	id?: string;
	onCropped?: (url: string) => void;
	onUnsupportedFile?: (file: File) => void;
	src?: string;
}>;
export type ImageCropperUploadTriggerProps = ImageCropperUploadTriggerPropsWithoutHTML &
	WithoutChildren<HTMLAttributes<HTMLLabelElement>>;
export type ImageCropperUploadTriggerPropsWithoutHTML = WithChildren<{
	ref?: HTMLLabelElement | null;
}>;
