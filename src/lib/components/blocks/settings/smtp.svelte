<script lang="ts">
	import SocketIcon from '@lucide/svelte/icons/chevrons-left-right-ellipsis';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import EyeClosedIcon from '@lucide/svelte/icons/eye';
	import EyeIcon from '@lucide/svelte/icons/eye-closed';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ServerIcon from '@lucide/svelte/icons/server';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import { invalidateAll } from '$app/navigation';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Item from '$lib/components/ui/item';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import { m } from '$lib/paraglide/messages';
	import { updateSMTPForm, verifySMTP } from '$lib/remotes/config.remote';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';

	import ConfigEnableSmtpSsl from './enable-smtp-ssl.svelte';
	import ConfigEnableSmtp from './enable-smtp.svelte';
	const {
		smtp
	}: {
		smtp: {
			enabled: boolean;
			from?: string;
			host?: string;
			pass?: string;
			port?: number;
			secure?: boolean;
			user?: string;
		};
	} = $props();
	let showPass = $state(false);
	// svelte-ignore state_referenced_locally
	let change = $state<Record<string, boolean | number | string | undefined>>(smtp);
	let validSMTP = $state<boolean | null>(null);
	const callVerifySMTP = async () => {
		const success = await verifySMTP();
		validSMTP = success;
		return { success };
	};
	const isOriginal = $derived.by(() => {
		return Object.entries(smtp).every(([k, v]) => {
			return change[k] === v;
		});
	});
</script>

<Item.Root class="min-h-24 w-full p-0" size="sm">
	<Item.Root variant="outline" size="sm" class="w-full p-0">
		<Item.Content class=" w-full">
			<Accordion.Root type="single" class="w-full! max-w-none">
				<Accordion.Item value="watchlist" class="relative w-full p-0">
					<div class="flex w-full">
						<Accordion.Trigger class="group min-h-24 w-full max-w-none! px-4 no-underline!">
							<div class="flex w-full flex-col gap-1">
								<span>{m.control_smtp()}</span>
								<span class="max-w-md @xl:text-xs text-balance text-muted-foreground"
									>{m.control_smtp_helper()}</span
								>
							</div>
						</Accordion.Trigger>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger
									class={buttonVariants({
										class: 'absolute end-10 top-2.5 rounded-full p-0',
										size: 'sm',
										variant: 'ghost'
									})}
								>
									{#await callVerifySMTP()}
										<CircleIcon class=" size-3! animate-pulse fill-current/50 text-sm" />
									{:then { success }}
										{#if success}
											<CircleIcon class=" size-3! fill-current/50 text-sm text-success" />
										{:else}
											<CircleIcon class="text-danger size-3! fill-current/50 text-sm" />
										{/if}
									{/await}
								</Tooltip.Trigger>
								<Tooltip.Content>
									{#if validSMTP === null}
										<p>{m.control_smtp_verification()}</p>
									{:else if validSMTP}
										<p>{m.control_smtp_verification_ok()}</p>
									{:else}
										<p>{m.control_smtp_verification()}</p>
									{/if}
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</div>
					<Accordion.Content class="w-full p-0">
						<form
							class="w-full"
							in:fly|global={{ y: 12 }}
							{...updateSMTPForm.enhance(async ({ submit }) => {
								try {
									await submit();
									toast.success(m.settings_saved());
									await invalidateAll();
								} catch (error) {
									console.error(error);
									toast.error(m.errors_settings_saving());
								}
							})}
						>
							<Field.Set
								class="@container flex min-h-[120px] w-full flex-col gap-0 divide-y overflow-hidden border-t border-border"
							>
								<div class="p-4">
									<ConfigEnableSmtp {smtp} />
								</div>
								<div
									class="grid w-full grid-cols-1 divide-y @sm:grid-cols-2 @sm:divide-x @sm:divide-y-0"
								>
									<div class="p-4">
										<Field.Field orientation="vertical">
											<Field.Label for="username">{m.username()}</Field.Label>
											<InputGroup.Root>
												<InputGroup.Addon align="inline-start" class="pe-0!"
													><UserRoundIcon /></InputGroup.Addon
												>
												<InputGroup.Input
													placeholder={m.control_smtp_username_placeholder()}
													disabled={smtp?.enabled !== true}
													value={change.user}
													type="text"
													aria-invalid={updateSMTPForm.fields.user.as('text')['aria-invalid']}
													oninput={(e) => (change.user = e.currentTarget.value)}
												/>
											</InputGroup.Root>
											<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
												{m.control_smtp_username_helper()}
											</Field.Description>
										</Field.Field>
									</div>
									<div class="p-4">
										<Field.Field>
											<Field.Label for="password">{m.password()}</Field.Label>
											<ButtonGroup>
												<InputGroup.Root>
													<InputGroup.Addon align="inline-start" class="pe-0!"
														><KeyRoundIcon /></InputGroup.Addon
													>
													<InputGroup.Input
														placeholder={m.control_smtp_password_placeholder()}
														disabled={smtp?.enabled !== true}
														value={change.pass}
														type={showPass ? 'text' : 'password'}
														aria-invalid={updateSMTPForm.fields.pass.as(
															showPass ? 'text' : 'password'
														)['aria-invalid']}
														oninput={(e) => (change.pass = e.currentTarget.value)}
													/>
												</InputGroup.Root>
												<Button size="icon" onclick={() => (showPass = !showPass)} tabindex={-1}>
													{#if showPass}
														<EyeIcon />
													{:else}
														<EyeClosedIcon />
													{/if}
												</Button>
											</ButtonGroup>
											<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
												{m.control_smtp_password_helper()}
											</Field.Description>
										</Field.Field>
									</div>
								</div>
								<div class="grid grid-cols-1 divide-y @sm:grid-cols-2 @sm:divide-x @sm:divide-y-0">
									<div class="p-4">
										<Field.Field orientation="vertical">
											<Field.Label for="host">{m.control_smtp_host()}</Field.Label>
											<InputGroup.Root>
												<InputGroup.Addon align="inline-start" class="pe-0!"
													><ServerIcon /></InputGroup.Addon
												>
												<InputGroup.Input
													placeholder={m.control_smtp_host_placeholder()}
													value={change.host}
													type="text"
													aria-invalid={updateSMTPForm.fields.host.as('text')['aria-invalid']}
													oninput={(e) => (change.host = e.currentTarget.value)}
													disabled={smtp?.enabled !== true}
												/>
											</InputGroup.Root>
											<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
												{m.control_smtp_host_helper()}
											</Field.Description>
										</Field.Field>
									</div>
									<div class="p-4">
										<Field.Field orientation="vertical">
											<Field.Label for="port">{m.control_smtp_port()}</Field.Label>
											<InputGroup.Root>
												<InputGroup.Addon align="inline-start" class="pe-0!"
													><SocketIcon /></InputGroup.Addon
												>
												<InputGroup.Input
													placeholder={m.control_smtp_port_placeholder()}
													value={change.port}
													type={updateSMTPForm.fields.port.as('number')?.type}
													aria-invalid={updateSMTPForm.fields.port.as('number')['aria-invalid']}
													oninput={(e) => (change.port = e.currentTarget.value)}
													style="appearance: textfield"
													disabled={smtp?.enabled !== true}
												/>
											</InputGroup.Root>
											<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
												{m.control_smtp_port_helper()}
											</Field.Description>
										</Field.Field>
									</div>
								</div>
								<div class="grid grid-cols-1 divide-y @sm:grid-cols-2 @sm:divide-x @sm:divide-y-0">
									<div class="p-4">
										<Field.Field orientation="vertical">
											<Field.Label for="from">{m.control_smtp_from()}</Field.Label>
											<InputGroup.Root>
												<InputGroup.Addon align="inline-start" class="pe-0!"
													><MailIcon /></InputGroup.Addon
												>
												<InputGroup.Input
													value={change.from}
													type="text"
													name={updateSMTPForm.fields.from.as('text').name}
													aria-invalid={updateSMTPForm.fields.from.as('text')['aria-invalid']}
													oninput={(e) => (change.from = e.currentTarget.value)}
													placeholder={m.control_smtp_from_placeholder()}
													disabled={smtp?.enabled !== true}
												/>
											</InputGroup.Root>
											<Field.Description class="mt-1! max-w-xl @xl:text-xs text-balance">
												{m.control_smtp_from_helper()}
											</Field.Description>
										</Field.Field>
									</div>
									<div class="p-4">
										<ConfigEnableSmtpSsl {smtp} />
									</div>
								</div>
								<div class="p-4">
									<Button type="submit" disabled={isOriginal}>{m.save_changes()}</Button>
								</div>
							</Field.Set>
						</form>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</Item.Content>
	</Item.Root>
</Item.Root>
