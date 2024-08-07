export function hover(element: Element, options: { enter(): void; exit(): void; click?(): void }) {
	const onMouseEnter = () => {
		options.enter();
	};
	const onMouseLeave = () => {
		options.exit();
	};
	const onMouseClick = () => {
		options?.click?.();
	};

	element.addEventListener('mouseenter', onMouseEnter);
	element.addEventListener('mouseleave', onMouseLeave);
	element.addEventListener('click', onMouseClick);

	return {
		update(opts: { enter(): void; exit(): void }) {
			options = opts;
		},
		destroy() {
			element.removeEventListener('mouseenter', onMouseEnter);
			element.removeEventListener('mouseleave', onMouseLeave);
			element.removeEventListener('click', onMouseClick);
		}
	};
}
