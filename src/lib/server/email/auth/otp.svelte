<script lang="ts">
	import logo from '$lib/assets/logo.svg?raw';
	import { m } from '$lib/paraglide/messages';
	const {
		appname,
		ip,
		name,
		origin,
		otp
	}: {
		appname: string;
		ip: string;
		name: string;
		origin: string;
		otp: string;
	} = $props();
	const bg = '#eceff4';
	const card = '#e5e9f0';
	const border = '#d8dee9';
	const fg = '#2e3440';
	const muted = '#4c566a';
	const primary = '#5e81ac';
	const primaryFg = '#eceff4';
</script>

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
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={origin} style="padding:0;width:32px;height:32px">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html logo}
			</a>
			<h2 style="font-size:24px;font-weight:600;color:{primary}">
				{appname}
			</h2>
		</div>
		<p style="font-size:16px;line-height:24px;color:{muted};margin:12px 0">
			{m.auth_hello({ name })}
		</p>
		<p style="font-size:16px;line-height:24px;color:{muted};margin:12px 0">
			{m.auth_verification_otp()}
		</p>
		<div
			style="
				display:inline-block;
				padding:16px 28px;
				margin:16px 0;
				border-radius:6px;
				background-color:{primary};
				color:{primaryFg};
				font-size:28px;
				letter-spacing:4px;
				font-family:monospace;
				font-weight:700;
			"
		>
			{otp}
		</div>
		<table style="width:100%;margin-top:32px;border-collapse:collapse">
			<tbody>
				<tr>
					<td
						style="border:1px solid {border};padding:6px;font-family:monospace;font-size:14px;color:{muted}"
					>
						{ip}
					</td>
					<td
						style="border:1px solid {border};padding:6px;font-family:monospace;font-size:14px;color:{muted}"
					>
						{new Date().toUTCString()}
					</td>
					<td
						style="border:1px solid {border};padding:6px;font-family:monospace;font-size:14px;color:{muted}"
					>
						OTP
					</td>
				</tr>
			</tbody>
		</table>
		<p style="text-align:center;font-size:14px;color:{muted};margin-top:32px">
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
	}
</style>
