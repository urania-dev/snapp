let timer: number;

export function debounce<T extends (...args: any[]) => void>(
	func: T,
	timeout = 300
): (...args: Parameters<T>) => void {
	return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(this, args);
		}, timeout);
	};
}
