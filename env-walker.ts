import { readdir, readFile } from 'fs/promises';
import { extname, join } from 'path';

const validExtensions = ['.js', '.ts', '.svelte'];
const envRegex = /\b(?:process\.env|env)\.([a-zA-Z_][a-zA-Z0-9_]*)\b/g;

async function main() {
	const rootDir = Bun.argv[2] ?? '.';
	const usageMap = new Map<string, Set<string>>();

	for await (const filePath of walk(rootDir)) {
		await searchEnvVars(filePath, usageMap);
	}

	for (const [envVar, paths] of usageMap) {
		const pathList = [...paths].join(', ');
		console.log(`${envVar}= # ${pathList}`);
	}
}

async function searchEnvVars(filePath: string, usageMap: Map<string, Set<string>>) {
	const content = await readFile(filePath, 'utf8');
	let match;
	while ((match = envRegex.exec(content)) !== null) {
		const envVar = match[1];
		if (!usageMap.has(envVar)) usageMap.set(envVar, new Set());
		usageMap.get(envVar)!.add(filePath);
	}
}

async function* walk(dir: string): AsyncGenerator<string> {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name === 'node_modules') continue;
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walk(fullPath);
		} else if (validExtensions.includes(extname(entry.name))) {
			yield fullPath;
		}
	}
}

main().catch(console.error);
