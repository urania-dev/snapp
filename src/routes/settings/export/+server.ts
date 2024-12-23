import { prisma } from "$lib/server/prisma";
import { error } from "@sveltejs/kit";
import Papa from "papaparse";
export const GET = async ({ locals: { session, user } }) => {
  if (!session || !user) throw error(401);

  const snapps = await prisma.snapp.findMany({
    include: { tags: true, user: true },
  });
  let csv: string;

  try {
    csv = convertToCSV(snapps);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=snapps-export-[" +
          new Date().getTime() + "]-[complete].csv",
        "Content-Length": `${csv.length}`,
      },
    });
  } catch (err) {
    throw error(500, { message: (err as Error)?.message });
  }
};

function convertToCSV(snapps: Snapp[]) {
  return Papa.unparse<Snapp>(snapps, { header: true });
}
