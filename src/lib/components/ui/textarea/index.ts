import Root from './textarea.svelte';

type FormTextareaEvent<T extends Event = Event> = {
	currentTarget: EventTarget & HTMLTextAreaElement;
} & T;

type TextareaEvents = {
	blur: FormTextareaEvent<FocusEvent>;
	change: FormTextareaEvent<Event>;
	click: FormTextareaEvent<MouseEvent>;
	focus: FormTextareaEvent<FocusEvent>;
	input: FormTextareaEvent<InputEvent>;
	keydown: FormTextareaEvent<KeyboardEvent>;
	keypress: FormTextareaEvent<KeyboardEvent>;
	keyup: FormTextareaEvent<KeyboardEvent>;
	mouseenter: FormTextareaEvent<MouseEvent>;
	mouseleave: FormTextareaEvent<MouseEvent>;
	mouseover: FormTextareaEvent<MouseEvent>;
	paste: FormTextareaEvent<ClipboardEvent>;
};

export {
	type FormTextareaEvent,
	Root,
	//
	Root as Textarea,
	type TextareaEvents
};
