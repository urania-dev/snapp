import type { Component, ComponentProps } from "svelte";

import Emailer, { inline } from "@uraniadev/emailer";
import { createRequire } from "module";
import { createTransport, type Transporter } from "nodemailer";
import { join } from "path";
import TurndownService from "turndown";

import { DEBUG, getSettings } from "../config";
import { log } from "../log";

export const getSMTP = async () => {
	const serverSettings = await getSettings();
	const require = createRequire(import.meta.url);

	const smtpConfig = require(join(process.cwd(), "smtp.config.cjs")) as (
		settings: typeof serverSettings
	) => Promise<{
		auth: { [key: string]: string };
		host: string;
		port: number;
		secure: boolean;
	}>;
	if (DEBUG) log.info(smtpConfig, "SMTP Config file loaded");
	const config = await smtpConfig(serverSettings);
	if (DEBUG) log.info(config, "SMTP actual config");
	if (config?.host === "smtp-host") throw new Error("SMTP not set");
	return config;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendEmail = async <T extends Component<ComponentProps<T>, any, any>>(
	email: T,
	args?: ComponentProps<T>,
	to?: string,
	subject?: string
) => {
	let smtp: {
		auth: { [key: string]: string };
		host: string;
		port: number;
		secure: boolean;
	} | null = null;

	let transporter: null | Transporter = null;

	try {
		smtp = await getSMTP();
		if (smtp !== null) {
			transporter = createTransport({ ...smtp });
			log.info({ label: "test", smtp, test: await transporter.verify() });
		}
	} catch (e) {
		smtp = null;
		if (DEBUG) log.warn(e, "SMTP not configured, logging email to console.");
	}

	const settings = await getSettings();
	const from = settings.get<string>("SMTP_FROM") || process.env.SMTP_USER;
	const emailer = new Emailer();
	const html = emailer.render(email, args, {
		dir: "ltr",
		lang: "en",
		props: {
			body: [`style=${inline("bg-neutral-900 text-neutral-50")}`],
			container: [`style=${inline("max-w-[620px] mx-auto py-4")}`],
			html: [`style=${inline("bg-neutral-900 text-neutral-50 p-4")}`]
		},
		style: ""
	});

	if (!smtp) {
		const cleanedHtml = html
			.replace(/:root\s*{[^}]*}/g, "") // Remove `:root { ... }`
			.replace(/\s*\*\s*{[^}]*}/g, "") // Remove global * {} styles
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove <style> tags
			.replace(/\n\s*\n/g, "\n"); // Remove excessive blank lines

		const turndownService = new TurndownService({
			codeBlockStyle: "fenced",
			headingStyle: "atx"
		});

		// Remove images
		turndownService.addRule("noImages", {
			filter: "img",
			replacement: () => ""
		});

		// Remove links that only wrap images
		turndownService.addRule("stripEmptyLinks", {
			filter: (node: Node) =>
				node.nodeName === "A" &&
				node.childNodes.length === 1 &&
				node.firstChild?.nodeName === "IMG",
			replacement: () => ""
		});

		// Trim leading/trailing whitespace from text nodes
		turndownService.addRule("cleanWhitespace", {
			filter: (node: Node) => node.nodeType === 3, // Text node
			replacement: (content: string) => content.trim()
		});

		// Prevent newline breaks around links like [\nText\n](url)
		turndownService.addRule("linkFormatter", {
			filter: "a",
			replacement: (content: string, node: Node) => {
				const href = (node as HTMLAnchorElement).getAttribute("href");
				if (!href) return content;
				return `[${content.trim()}](${href})`;
			}
		});

		const markdown = turndownService.turndown(cleanedHtml).trim();

		log.info(`
### ✉️ Email Preview (Markdown Output)
**To**: \`${to}\`
**From**: \`${from}\`
**Subject**: \`${subject}\`\n
${markdown}`);
		return;
	}

	try {
		if (transporter) await transporter.sendMail({ from, html, subject, to });
	} catch (error) {
		if (DEBUG) log.error(error);
	}
};
