<script lang="ts">
	import logo from '$lib/assets/logo.svg?raw';
	import { m } from '$lib/paraglide/messages';

	const {
		appname,
		email,
		ip,
		origin,
		url
	}: { appname: string; email: string; ip: string; origin: string; url: string } = $props();

	const bg = '#eceff4';
	const card = '#e5e9f0';
	const border = '#d8dee9';
	const fg = '#2e3440';
	const muted = '#4c566a';
	const primary = '#5e81ac';
	const primaryFg = '#eceff4';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div
	class="email-wrapper"
	style:background-color={bg}
	style:padding="40px 0"
	style:width="100%"
	style:font-family="'Inter', sans-serif"
>
	<div
		class="email-card"
		style:max-width="600px"
		style:margin="0 auto"
		style:padding="20px"
		style:background-color={card}
		style:border={`1px solid ${border}`}
		style:border-radius="8px"
		style:color={fg}
	>
		<div style="display:flex;align-items:center;gap:.25rem">
			<a href={origin} style="padding:0;width:32px;height:32px">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html logo}
			</a>
			<h2
				class="email-heading"
				style:font-size="24px"
				style:font-weight="600"
				style:color={primary}
			>
				{appname}
			</h2>
		</div>

		<p
			class="email-text"
			style:font-size="16px"
			style:line-height="24px"
			style:color={muted}
			style:margin="12px 0"
		>
			{m.auth_hello({ name: email })}
		</p>

		<p
			class="email-text"
			style:font-size="16px"
			style:line-height="24px"
			style:color={muted}
			style:margin="12px 0"
		>
			{m.mail_text_admin_user_intro?.({ appname })}
		</p>

		<a
			href={url}
			class="email-button"
			style:display="inline-block"
			style:background-color={primary}
			style:color={primaryFg}
			style:padding="12px 24px"
			style:border-radius="6px"
			style:text-decoration="none"
			style:font-size="16px"
			style:margin-top="16px"
		>
			{m.mail_cta_admin_user?.()}
		</a>

		<table style="width:100%;margin-top:32px;border-collapse:collapse">
			<tbody>
				<tr>
					<td
						class="email-td"
						style:border={`1px solid ${border}`}
						style:padding="6px"
						style:font-family="monospace"
						style:font-size="14px"
						style:color={muted}
					>
						{ip}
					</td>
					<td
						class="email-td"
						style:border={`1px solid ${border}`}
						style:padding="6px"
						style:font-family="monospace"
						style:font-size="14px"
						style:color={muted}
					>
						{new Date().toUTCString()}
					</td>
					<td
						class="email-td"
						style:border={`1px solid ${border}`}
						style:padding="6px"
						style:font-family="monospace"
						style:font-size="14px"
						style:color={muted}
					>
						Magic Link Login
					</td>
				</tr>
			</tbody>
		</table>

		<p
			class="email-footer"
			style:text-align="center"
			style:font-size="14px"
			style:color={muted}
			style:margin-top="32px"
		>
			{m.email_ignore()}
		</p>
	</div>
</div>

<style>
	@media (prefers-color-scheme: dark) {
		.email-wrapper {
			background-color: #1a1c1f !important;
		}
		.email-card {
			background-color: #242830 !important;
			border-color: #3b4252 !important;
			color: #eceff4 !important;
		}
		.email-heading {
			color: #d08770 !important;
		}
		.email-text {
			color: #d8dee9 !important;
		}
		.email-button {
			background-color: #d08770 !important;
			color: #1a1c1f !important;
		}
		.email-td {
			color: #d8dee9 !important;
			border-color: #3b4252 !important;
		}
		.email-footer {
			color: #d8dee9 !important;
		}
	}
</style>
