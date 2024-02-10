import { db } from '$lib/db/index.js';
import { error, redirect } from '@sveltejs/kit';
import Papa from 'papaparse';

export async function GET({ locals, url }) {
	const session = await locals.getSession();

	if (!session) throw redirect(302, '/auth/login');

	const { searchParams } = url;

	const ids = searchParams.get('ids')?.toString()?.split(',') ?? [];
	let csv: string;

	try {
		if (ids.length > 0) {
			const snapps = ((await db.snapps.fetch(...ids)) as DBSnapp[]) || ([] as DBSnapp[]);
			if (!snapps || snapps.length === 0) throw error(404, { message: 'snapps:not:found' });
			csv = convertToCSV(snapps);
		} else {
			const snapps = ((await db.snapps.search().returnAll()) as DBSnapp[]) || ([] as DBSnapp[]);
			if (!snapps || snapps.length === 0) throw error(404, { message: 'snapps:not:found' });
			csv = convertToCSV(snapps);
		}

		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition':
					'attachment; filename=snapps-export-[' + new Date().getTime() + ']-[complete].csv',
				'Content-Length': `${csv.length}`
			}
		});
	} catch (error) {
		throw error;
	}
}

export function fallback() {
	throw error(405, { message: 'Method not allowed' });
}

function convertToCSV(snapps: DBSnapp[]) {
	return Papa.unparse<DBSnapp>(snapps, { header: true });
}
