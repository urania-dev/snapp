import { prisma } from "./src/lib/db/prisma";
import process from "node:process";
import { generateMetrics } from "./src/lib/components/settings/migration/fake-metrics";
import { log } from "./src/lib/server/log";

(async () => {
	let snappId: string = "",
		userId: string = "";
	try {
		[snappId, userId] = process.argv.slice(2);

		const snapp = await prisma.snapp.findUnique({
			where: { id: snappId }
		});
		if (!snapp) throw new Error("Snapp not found");

		await generateMetrics(snapp, userId, prisma);

		log.info("Background job finished for snapp: " + snappId);
		try {
			await prisma.setting.delete({
				where: {
					id: "migration_" + userId,
					userId
				}
			});
		} catch {}
		process.exit(0);
	} catch (err) {
		log.error(err, "Background job failed");
		if (userId)
			try {
				await prisma.setting.delete({
					where: {
						id: "migration_" + userId,
						userId
					}
				});
			} catch {}
		process.exit(1);
	}
})();
