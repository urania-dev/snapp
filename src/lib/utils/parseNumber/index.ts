
export default async function parseNumber(cb: Promise<string | undefined | null>) {
	const res = await cb;
	if (res && isNaN(parseInt(res))) return 0;
	else if (res) return parseInt(res);
	else return 0;
}