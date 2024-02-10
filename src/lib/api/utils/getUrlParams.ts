export default function getUrlParams(url: URL) {
	let page: number = Number(url.searchParams.get('page')?.toString()?.trim());
	let limit: number = Number(url.searchParams.get('limit')?.toString()?.trim());
	let search = url.searchParams.get('q')?.toString()?.trim();
	let sort = url.searchParams.get('sort')?.toString()?.trim();
	let sortDir = url.searchParams.get('direction')?.toString()?.trim() ?? 'asc';
	
	if (!page || isNaN(page)) page = 1;
	if (!limit || isNaN(limit)) limit = 8;	
	let offset = +(+page - 1) * +limit;

	return { page, limit, search, sort, sortDir, offset };
}

