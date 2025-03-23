import maxmind, { type CityResponse, type CountryResponse } from 'maxmind';

let lookup = await maxmind.open('maxmind/geolite2-city.mmdb');

async function getLocation(ip: string) {
	if (!lookup) {
		lookup = await maxmind.open('maxmind/geolite2-city.mmdb');
	}
	if (!ip || ip.trim() === '') return;
	const data = lookup.get(ip);
	if (data === null) return null;
	const city = (data as CityResponse).city?.names.en;
	const region = (data as CityResponse).subdivisions?.map((subdiv) => subdiv.names.en).join(' / ');
	const country = (data as CountryResponse).country?.names.en;
	return { city, country, region };
}

export { getLocation };
