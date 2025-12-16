import fs from "node:fs";
import path from "node:path";

export const GET = async ({ params: { path: file },  }) => {

    const root = "config/logos";
    const filepath = path.join(root, file);

    if (!fs.existsSync(filepath)) {
        return new Response("Not found", { status: 404 });
    }

    const stream = fs.readFileSync(filepath);
    return new Response(stream, {
        headers: {
            "Cache-Control": "public, max-age=3600",
            "Content-Type": "image/webp"
        },
        status: 200
    });
};
