import { tick } from "svelte";

export class LocalStorage<T> {
	get current(): T {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		this.#version;

		const root =
			typeof localStorage !== "undefined"
				? (JSON.parse(localStorage.getItem(this.#key)?.toString() || "") as T)
				: this.#value;

		const proxies = new WeakMap();

		const proxy = (value: unknown) => {
			if (typeof value !== "object" || value === null) {
				return value;
			}

			let p = proxies.get(value);

			if (!p) {
				p = new Proxy(value, {
					get: (target, property) => {
						// eslint-disable-next-line @typescript-eslint/no-unused-expressions
						this.#version;
						return proxy(Reflect.get(target, property));
					},
					set: (target, property, value) => {
						this.#version += 1;
						Reflect.set(target, property, value);

						if (typeof localStorage !== "undefined") {
							localStorage.setItem(this.#key, JSON.stringify(root));
						}

						return true;
					}
				});

				proxies.set(value, p);
			}

			return p;
		};

		if ($effect.tracking()) {
			$effect(() => {
				if (this.#listeners === 0) {
					globalThis.addEventListener("storage", this.#handler);
				}

				this.#listeners += 1;

				return () => {
					tick().then(() => {
						this.#listeners -= 1;
						if (this.#listeners === 0) {
							globalThis.removeEventListener("storage", this.#handler);
						}
					});
				};
			});
		}

		return proxy(root);
	}
	set current(value) {
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(this.#key, JSON.stringify(value));
		}

		this.#version += 1;
	}
	#key: string;
	#listeners = 0;

	#value: T | undefined;

	#version = $state(0);

	constructor(key: string, initial?: T) {
		this.#key = key;
		this.#value = initial;

		if (typeof localStorage !== "undefined") {
			if (localStorage.getItem(key) === null) {
				localStorage.setItem(key, JSON.stringify(initial));
			}
		}
	}

	#handler = (e: StorageEvent) => {
		if (e.storageArea !== localStorage) return;
		if (e.key !== this.#key) return;

		this.#version += 1;
	};
}
