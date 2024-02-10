export default function (object: object) {
	return JSON.parse(JSON.stringify(object));
}
