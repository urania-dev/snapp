<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';

	import ClockIcon from '@lucide/svelte/icons/clock';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import MouseClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
	import SquareAsteriskIcon from '@lucide/svelte/icons/square-asterisk';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import Dialog from '$lib/components/blocks/commons/dialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import { m } from '$lib/paraglide/messages';
	import { createApiKey } from '$lib/remotes/api-tokens.remote';
	import { slugify } from '$lib/utils';

	import type { ApiKey } from './apikey.columns.svelte';

	import CopyButton from '../copy-button/copy-button.svelte';
	let { host, showCreate = $bindable() }: { host: THost; showCreate: boolean } = $props();
	let expireInValue = $state<number>();
	let currentWindowSpan = $state('minutes');
	let currentTimeSpan = $state('none');
	let id = $props.id();
	const getExpiration = (exp: number, span: string) => {
		if (!exp || span === 'none') return undefined;
		switch (span) {
			case 'days':
				return 60 * 60 * 24 * exp;
			case 'months':
				return 60 * 60 * 24 * 30 * exp;
			case 'weeks':
				return 60 * 60 * 24 * 7 * exp;
			case 'years':
				return 60 * 60 * 24 * 365 * exp;
		}
	};
	let rate = $state<number>();
	let window = $state<number>(1000 * 60 * 60 * 24);
	let expiresIn = $state<number>();
	let permissions = $state<Record<string, string[]>>({});
	let rateLimited = $state(false);
	let apiKey = $state<ApiKey | null>(null);
	const authClient = $derived(getAuthClient(host.origin, page.data.fetch));
</script>

<Dialog
	bind:open={showCreate}
	title={m.api_key_create_one()}
	description={m.api_key_create_helper()}
	onOpenChange={() => (apiKey = null)}
	>{#if apiKey === null}
		<form
			class="flex min-h-[394px] flex-col"
			{...createApiKey.enhance(async ({ submit }) => {
				try {
					await submit();
					if (createApiKey.result?.apiKey) {
						apiKey = createApiKey.result.apiKey;
					}
				} catch (error) {
					console.error(error);
				}
			})}
		>
			<svelte:boundary>
				{#snippet pending()}
					<LoaderIcon class="m-auto size-8! animate-spin" />
				{/snippet}
				{@const organizations = await authClient.organization.list()}
				<Field.FieldSet>
					<Field.Field
						data-invalid={Array.isArray(createApiKey.fields.name.issues())}
						class="shrink-0"
					>
						<Field.Label for="name">{m.name()}</Field.Label>
						<InputGroup.Root>
							<InputGroup.Addon><SquareAsteriskIcon class="size-5!" /></InputGroup.Addon>
							<InputGroup.Input
								id="{id}-name"
								placeholder={m.placeholders_api_key_name()}
								{...createApiKey.fields.name.as('text')}
							/>
						</InputGroup.Root>
						{#each createApiKey.fields.name.issues() as issue (issue)}
							<Field.Error>{issue.message}</Field.Error>
						{:else}
							<Field.Description>{m.helpers_api_key_name()}</Field.Description>
						{/each}
					</Field.Field>
					<Field.Field
						data-invalid={Array.isArray(createApiKey.fields.expiresIn.issues())}
						class="shrink-0"
					>
						<Field.Label for="rate">{m.api_key_custom_limit()}</Field.Label>
						<input hidden {...createApiKey.fields.expiresIn.as('text')} bind:value={expiresIn} />
						<InputGroup.Root>
							<InputGroup.Addon><ClockIcon class="size-5!" /></InputGroup.Addon>
							<InputGroup.Input
								id="{id}-expiresIn"
								bind:value={expireInValue}
								placeholder={m.placeholders_api_key_expires_in()}
								oninput={() => {
									if (expireInValue) expiresIn = getExpiration(expireInValue, currentTimeSpan);
								}}
							/>
							<Select.Root
								type="single"
								bind:value={currentTimeSpan}
								onOpenChange={() => {
									if (expireInValue) expiresIn = getExpiration(expireInValue, currentTimeSpan);
								}}
							>
								<Select.Trigger class="w-[180px]"
									>{currentTimeSpan || m.select_timespan()}</Select.Trigger
								>
								<Select.Content>
									<Select.Item class="capitalize" value="none">{m.none()}</Select.Item>
									<Select.Item class="capitalize" value="days">{m.time_days()}</Select.Item>
									<Select.Item class="capitalize" value="weeks">{m.time_weeks()}</Select.Item>
									<Select.Item class="capitalize" value="months">{m.time_months()}</Select.Item>
									<Select.Item class="capitalize" value="years">{m.time_years()}</Select.Item>
								</Select.Content>
							</Select.Root>
						</InputGroup.Root>
						{#each createApiKey.fields.expiresIn.issues() as issue (issue)}
							<Field.Error>{issue.message}</Field.Error>
						{:else}
							<Field.Description>{m.helpers_api_key_expires_in()}</Field.Description>
						{/each}
					</Field.Field>
					<Field.Label for="rate-limited">
						<Field.Field orientation="horizontal">
							<Field.Content>
								<Field.Title>{m.rate_limited()}</Field.Title>
								<Field.Description>{m.api_key_rate_limited()}</Field.Description>
							</Field.Content>
							<Switch id="rate-limited" bind:checked={rateLimited} />
						</Field.Field>
					</Field.Label>
					{#if rateLimited}
						<Field.Field
							data-invalid={Array.isArray(createApiKey.fields.rate.issues())}
							class="shrink-0"
						>
							<input hidden bind:value={window} name="window" />
							<Field.Label for="rate">{m.api_key_custom_limit()}</Field.Label>
							<InputGroup.Root>
								<InputGroup.Addon><MouseClickIcon class="size-5!" /></InputGroup.Addon>
								<InputGroup.Input
									{...createApiKey.fields.rate.as('text')}
									id="{id}-rate"
									bind:value={rate}
									placeholder={m.placeholder_rate_limit()}
								/>
								<Select.Root
									type="single"
									bind:value={currentWindowSpan}
									onOpenChange={() => {
										if (rate) {
											switch (currentWindowSpan) {
												case 'days':
													window = 1000 * 60 * 60 * 24;
													break;
												case 'hours':
													window = 1000 * 60 * 60;
													break;
												case 'minutes':
													window = 1000 * 60;
													break;
												default:
													break;
											}
										}
									}}
								>
									<Select.Trigger class="w-[180px]"
										>{currentWindowSpan === 'minutes'
											? m.time_minutes()
											: currentTimeSpan === 'hours'
												? m.time_hours()
												: currentTimeSpan === 'days'
													? m.time_hours()
													: m.select_timespan()}</Select.Trigger
									>
									<Select.Content>
										<Select.Item class="capitalize" value="minutes">{m.time_minutes()}</Select.Item>
										<Select.Item class="capitalize" value="hours">{m.time_hours()}</Select.Item>
										<Select.Item class="capitalize" value="days">{m.time_days()}</Select.Item>
									</Select.Content>
								</Select.Root>
							</InputGroup.Root>
							{#each createApiKey.fields.expiresIn.issues() as issue (issue)}
								<Field.Error>{issue.message}</Field.Error>
							{:else}
								<Field.Description>{m.helpers_api_key_expires_in()}</Field.Description>
							{/each}
						</Field.Field>
					{/if}
					<Field.Field>
						<Field.Label for="permission">{m.permissions()}</Field.Label>
						<Table.Root class="mb-1 border">
							<Table.Header>
								<Table.Row class="divide-x">
									<Table.Head>{m.organization()}</Table.Head>
									<Table.Head class="text-center">{m.read()}</Table.Head>
									<Table.Head class="text-center">{m.write()}</Table.Head>
									<Table.Head class="text-center">{m.delete()}</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#if 'data' in organizations}
									{#each organizations?.data as o (o)}
										<Table.Row class="divide-x">
											<Table.Cell>
												{o.name}
											</Table.Cell>
											<Table.Cell class="p-0!">
												<Label class="mx-auto flex w-full justify-center p-2">
													<Checkbox
														bind:checked={
															() => permissions?.[o.id]?.includes('read') || false,
															(v: boolean) => {
																if (v) {
																	if (o.id in permissions) {
																		permissions[o.id] = Array.from(
																			new Set(['read', ...permissions[o.id]])
																		);
																	} else {
																		permissions = { ...permissions, [o.id]: ['read'] };
																	}
																} else {
																	if (o.id in permissions) {
																		permissions[o.id] = Array.from(
																			new Set([...permissions[o.id].filter((p) => p !== 'read')])
																		);
																	} else {
																		permissions = { ...permissions, [o.id]: [] };
																	}
																}
															}
														}
													/>
												</Label>
											</Table.Cell>
											<Table.Cell class="p-0!">
												<Label class="mx-auto flex w-full justify-center p-2">
													<Checkbox
														bind:checked={
															() => permissions?.[o.id]?.includes('write') || false,
															(v: boolean) => {
																if (v) {
																	if (o.id in permissions) {
																		permissions[o.id] = Array.from(
																			new Set(['write', ...permissions[o.id]])
																		);
																	} else {
																		permissions = { ...permissions, [o.id]: ['write'] };
																	}
																} else {
																	if (o.id in permissions) {
																		permissions[o.id] = Array.from(
																			new Set([...permissions[o.id].filter((p) => p !== 'write')])
																		);
																	} else {
																		permissions = { ...permissions, [o.id]: [] };
																	}
																}
															}
														}
													/>
												</Label>
											</Table.Cell>
											<Table.Cell class="p-0!">
												<Label class="mx-auto flex w-full justify-center p-2">
													<Checkbox
														bind:checked={
															() => permissions?.[o.id]?.includes('delete') || false,
															(v: boolean) => {
																if (v) {
																	if (o.id in permissions) {
																		permissions[o.id] = Array.from(
																			new Set(['delete', ...permissions[o.id]])
																		);
																	} else {
																		permissions = { ...permissions, [o.id]: ['delete'] };
																	}
																} else {
																	if (o.id in permissions) {
																		permissions[o.id] = Array.from(
																			new Set([...permissions[o.id].filter((p) => p !== 'delete')])
																		);
																	} else {
																		permissions = { ...permissions, [o.id]: [] };
																	}
																}
															}
														}
													/>
												</Label>
											</Table.Cell>
										</Table.Row>
									{/each}
								{/if}
							</Table.Body>
						</Table.Root>
						{#each createApiKey.fields.expiresIn.issues() as issue (issue)}
							<Field.Error>{issue.message}</Field.Error>
						{:else}
							<Field.Description>{m.helpers_api_key_permissions()}</Field.Description>
						{/each}
						<input hidden name="permissions" value={JSON.stringify(permissions)} />
					</Field.Field>
					<Button type="submit">{m.confirm()}</Button>
				</Field.FieldSet>
			</svelte:boundary>
		</form>
	{:else}
		<div class="flex w-full flex-col gap-4">
			<Field.Field>
				<Field.Label>{m.api_key()}</Field.Label>
				<ButtonGroup>
					<InputGroup.InputGroup>
						<InputGroup.Addon><KeyRoundIcon /></InputGroup.Addon>
						<InputGroup.Input
							type="text"
							readonly
							value={(apiKey as unknown as { key: string }).key}
						/>
					</InputGroup.InputGroup>
					<CopyButton variant="outline" text={(apiKey as unknown as { key: string }).key} />
					<Button
						onclick={() => {
							if (!apiKey) return;
							var link = document.createElement('a');
							link.setAttribute(
								'href',
								'data:text/plain;charset=utf-8,' +
									encodeURIComponent((apiKey as unknown as { key: string }).key)
							);
							link.setAttribute(
								'download',
								`apikey-${slugify(apiKey.name || apiKey.createdAt.toISOString())}.txt`
							);
							document.body.appendChild(link);
							link.click();
							document.body.removeChild(link);
						}}
						variant="default"><DownloadIcon /></Button
					>
				</ButtonGroup>
				<Field.Description>{m.api_key_copy_helper()}</Field.Description>
			</Field.Field>
		</div>
	{/if}
</Dialog>
