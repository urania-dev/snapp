import type { NumericRange } from '@sveltejs/kit';

export default class SnappError {
	status: NumericRange<400, 599>;
	data: { [key: string]: any };

	constructor(status: NumericRange<400, 599>, data: { [key: string]: any }) {
		this.status = status;
		this.data = { ...data };
	}

	valueOf(): [number, any] {
		return [this.status as NumericRange<400, 599>, { ...(this.data || {}) }];
	}
}
