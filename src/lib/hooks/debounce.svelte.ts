export class Debouncer {
	#timeout = $state<NodeJS.Timeout>();
	debounce = <T extends (...args: unknown[]) => void>(func: T, timeout = 300) => {
		const timer = this.#timeout;
		return (...args: Parameters<T>) => {
			clearTimeout(timer);
			this.#timeout = setTimeout(() => {
				func.apply(this, args);
			}, timeout);
		};
	};
}
