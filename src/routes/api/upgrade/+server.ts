import { db } from '$lib/db';
import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import sqlite3 from 'sqlite3';

function createDbConnection(filepath: string) {
	const db = new sqlite3.Database(filepath, (error) => {
		if (error) throw error;
	});
	console.log('Connection with SQLite has been established');
	return db;
}

type OldSnapp = {
	id: string;
	original_url: string;
	short_code: string;
	created_at: Date;
	expires_at: Date | null;
	secret: string | null;
	has_secret: boolean;
	user_id: string;
};

async function selectSnapps(db: sqlite3.Database) {
	return new Promise<OldSnapp[]>((resolve, reject) => {
		db.all<OldSnapp>('SELECT * FROM Snapp', (error, rows) => {
			if (error) {
				reject(error);
			} else {
				resolve(rows);
			}
		});
	});
}
export async function GET() {
	const filepath = process.cwd() + '/prisma/db.sqlite';

	const dbSqlite = existsSync(filepath);
	if (!dbSqlite)
		return json({
			message: 'This instance has no prisma db.sqlite included'
		});

	const _db = createDbConnection(filepath);
	const rows = await selectSnapps(_db);

	if (rows && rows.length)
		if (rows && rows.length > 0) return json(rows);
		else return json({ message: 'No row found, are you sure?', rows });
}
