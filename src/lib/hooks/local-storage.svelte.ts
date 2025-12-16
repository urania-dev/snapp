import { browser } from '$app/environment';
export class LocalStorage<T> {
	current = $state<T>() as T;
	key = '';
	constructor(key: string, current: T) {
		this.key = key;
		this.current = current;
		if (browser) {
			const item = localStorage.getItem(key);
			if (item) this.current = this.deserialize(item);
		}
		$effect(() => {
			localStorage.setItem(this.key, this.serialize(this.current));
		});
	}
	deserialize(item: string): T {
		return JSON.parse(item);
	}
	serialize(current: T): string {
		return JSON.stringify(current);
	}
}
