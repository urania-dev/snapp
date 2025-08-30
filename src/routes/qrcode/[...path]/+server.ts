import { renderSVG } from "uqr";

export const GET = async ({ params: { path } }) => {
	const qrcode = renderSVG(path);

	return new Response(qrcode, {
		headers: {
			"Cache-Control": "max-age=" + 1000 * 60 * 60 * 24 * 365,
			"Content-Length": `${qrcode.length}`,
			"Content-Type": "image/svg+xml"
		}
	});
};
