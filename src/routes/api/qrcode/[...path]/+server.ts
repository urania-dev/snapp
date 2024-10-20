import { env } from '$env/dynamic/private';
import { renderSVG } from 'uqr'

export const GET = async ({ url, params: { path } }) => {
    const origin = env.ORIGIN
    const qrcode = renderSVG(origin + '/' + path);

    return new Response(qrcode, {
        headers: {
            'Content-Type': "image/svg+xml",
            'Content-Length': `${qrcode.length}`,
            'Cache-Control': "max-age=" + 1000 * 60 * 60 * 24 * 365
        }
    })
}