import fs from 'node:fs';

export const GET = async () => {
	const file = fs.readFileSync('config/custom.css', 'utf8');

	return new Response(file, {
		headers: {
			'cache-control': `max-age=${60 * 60 * 24 * 365}`,
			'content-length': Buffer.byteLength(file).toString(),
			'content-type': 'text/css'
		}
	});
};
