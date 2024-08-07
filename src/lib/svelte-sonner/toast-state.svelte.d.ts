import type { Component } from 'svelte';
import type { ExternalToast, HeightT, PromiseData, PromiseT, ToastT, ToastTypes } from './types';
type UpdateToastProps = {
	id: number | string;
	data: Partial<ToastT>;
	type: ToastTypes;
	message: string | Component | undefined;
	dismissable: boolean;
};
declare class ToastState {
	#private;
	toasts: ToastT[];
	heights: HeightT[];
	addToast: (data: ToastT) => void;
	updateToast: ({ id, data, type, message }: UpdateToastProps) => void;
	create: (
		data: ExternalToast & {
			message?: string | Component;
			type?: ToastTypes;
			promise?: PromiseT;
		}
	) => string | number;
	dismiss: (id?: number | string) => string | number | undefined;
	remove: (id?: number | string) => string | number | undefined;
	message: (message: string | Component, data?: ExternalToast) => string | number;
	error: (message: string | Component, data?: ExternalToast) => string | number;
	success: (message: string | Component, data?: ExternalToast) => string | number;
	info: (message: string | Component, data?: ExternalToast) => string | number;
	warning: <T extends Component = Component<{}, {}, string>>(
		message: string | T,
		data?: ExternalToast<T>
	) => string | number;
	loading: (message: string | Component, data?: ExternalToast) => string | number;
	promise: <ToastData>(
		promise: PromiseT<ToastData>,
		data?: PromiseData<ToastData>
	) => string | number | undefined;
	custom: <T extends Component = Component<{}, {}, string>>(
		component: T,
		data?: ExternalToast<T>
	) => string | number;
	removeHeight: (id: number | string) => void;
	setHeight: (data: HeightT) => void;
	reset: () => void;
}
export declare const toastState: ToastState;
declare function toastFunction<T extends Component>(
	message: string | T,
	data?: ExternalToast<T>
): string | number;
export declare const toast: typeof toastFunction & {
	success: (message: string | Component, data?: ExternalToast) => string | number;
	info: (message: string | Component, data?: ExternalToast) => string | number;
	warning: <T extends Component = Component<{}, {}, string>>(
		message: string | T,
		data?: ExternalToast<T> | undefined
	) => string | number;
	error: (message: string | Component, data?: ExternalToast) => string | number;
	custom: <T extends Component = Component<{}, {}, string>>(
		component: T,
		data?: ExternalToast<T> | undefined
	) => string | number;
	message: (message: string | Component, data?: ExternalToast) => string | number;
	promise: <ToastData>(
		promise: PromiseT<ToastData>,
		data?: PromiseData<ToastData> | undefined
	) => string | number | undefined;
	dismiss: (id?: number | string) => string | number | undefined;
	loading: (message: string | Component, data?: ExternalToast) => string | number;
};
export {};
