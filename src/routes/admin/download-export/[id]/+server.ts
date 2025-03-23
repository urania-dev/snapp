import { error } from '@sveltejs/kit';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';

export const GET = async ({ locals: { user }, params: { id } }) => {
	if (!user || (user.id !== id && user.role === 'user'))
		throw error(401, { message: 'errors.unauthorized' });
	const csvDir = path.resolve('output');
	const csvPath = path.join(csvDir, `${id}.csv`);

	if (!existsSync(csvPath)) {
		throw error(400, { message: 'errors.migration-failed' });
	}

	// Create a readable stream for the file
	const fileStream = createReadStream(csvPath);

	// Convert Node.js ReadableStream to a Web-compatible ReadableStream
	const webStream = Readable.toWeb(fileStream) as unknown as ReadableStream;

	const response = new Response(webStream, {
		headers: {
			'Content-Disposition': `attachment; filename="${id}.csv"`,
			'Content-Type': 'text/csv'
		}
	});

	return response;
};
