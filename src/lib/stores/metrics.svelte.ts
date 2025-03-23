import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
import { page } from '$app/state';
export type CharData = { date: string; value: number };
import { type Usage } from '@prisma/client';
import { getContext, setContext } from 'svelte';

class MetricsQueryStore {
	df = new DateFormatter(page.data.locale || 'en', {
		dateStyle: 'long'
	});

	today = new Date();

	end = $state(
		new CalendarDate(this.today.getFullYear(), this.today.getMonth() + 1, this.today.getDate() + 1)
	);
	weekAgo = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7);

	start = $state(
		new CalendarDate(
			this.weekAgo.getFullYear(),
			this.weekAgo.getMonth() + 1,
			this.weekAgo.getDate()
		)
	);
	url = $derived(
		`/api/usage/groupBy?q=${JSON.stringify({
			_count: {
				id: true // Count visits
			},
			by: ['timestamp'],
			orderBy: {
				_count: {
					id: 'desc'
				}
			},
			where: {
				timestamp: {
					gte: new Date(this.start.toDate(getLocalTimeZone())),
					lte: new Date(this.end.toDate(getLocalTimeZone()))
				}
			}
		})}`
	);

	loadFromDb = async () => {
		const data = [] as CharData[];
		const f = page.data.fetch as typeof fetch;
		if (!this.start || !this.end) return;
		const end = new Date(this.end.toDate(getLocalTimeZone()));
		end.setHours(23, 59, 59, 999);
		const url = `/api/usage/groupBy?q=${JSON.stringify({
			_count: {
				id: true // Count visits
			},
			by: ['timestamp'],
			orderBy: {
				timestamp: 'asc'
			},
			where: {
				timestamp: {
					gte: new Date(this.start.toDate(getLocalTimeZone())),
					lte: end
				}
			}
		})}`;

		try {
			
		const res = (await (await f(url)).json()) as { data: Usage[] };
		const usageMap = new Map<string, number>();

		res.data?.forEach((u) => {
			const date = new Date(u.timestamp).toLocaleDateString(page.data.locale, {
				day: 'numeric',
				month: 'numeric',
				timeZone: getLocalTimeZone()
			});
			usageMap.set(date, (usageMap.get(date) || 0) + 1);
		});

		for (
			let d = new Date(this.start.toDate(getLocalTimeZone()));
			d <= new Date(this.end.toDate(getLocalTimeZone()));
			d.setDate(d.getDate() + 1)
		) {
			const dateStr = d.toLocaleDateString(page.data.locale, {
				day: 'numeric',
				month: 'numeric',
				timeZone: getLocalTimeZone()
			});
			data.push({ date: dateStr, value: usageMap.get(dateStr) || 0 });
		}

		return data;

	} catch (error) {
		console.error(error)		
	}
	return []
	};

	setEnd = (date: Date = new Date()) =>
		(this.end = new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate() + 1));
	setStart = (date: Date = new Date()) =>
		(this.start = new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()));
}

const setMetricsStore = () => {
	return setContext('METRICS_STORE', new MetricsQueryStore());
};
const getMetricsStore = () => {
	return getContext<MetricsQueryStore>('METRICS_STORE');
};

export { getMetricsStore, MetricsQueryStore, setMetricsStore };
