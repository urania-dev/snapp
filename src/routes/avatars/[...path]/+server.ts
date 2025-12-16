import { requireUser } from "$lib/remotes/auth.remote";
import fs from "node:fs";
import path from "node:path";

export const GET = async ({ params: { path: file } }) => {
    const user = await requireUser();

    const root = "config/avatars";
    const directory = path.join(root, user.id);
    const filepath = path.join(directory, file);

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
