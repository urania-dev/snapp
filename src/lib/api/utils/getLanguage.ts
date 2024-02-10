import { env } from "$env/dynamic/private";
import { readFile } from "fs/promises";

export default async function getLanguage() {
	try {
		const jsonContent = JSON.parse(
			await readFile(`${env.LOCALIZATION_FOLDER}/${env.DEFAULT_LANG}.json`, 'utf8')
		);
		return jsonContent;
	} catch (error: any) {
		console.error(`Error loading translation file: ${error.message}`);
	}
}
