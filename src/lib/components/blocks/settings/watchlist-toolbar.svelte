<script lang="ts">
	import type { FormEventHandler } from 'svelte/elements';

	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import {
		addToWatchlist,
		getDomainBlacklist,
		getDomainWhitelist,
		getEmailBlacklist,
		getEmailWhitelist,
		getUsernameBlacklist,
		getUsernameWhitelist
	} from '$lib/remotes/watchlists.remote';
	import { toast } from 'svelte-sonner';
	import * as v from 'valibot';
	let entity = $state<string>('unset');
	let action = $state<string>('unset');
	let { limit = $bindable(), page = $bindable() }: { limit: number; page: number } = $props();
	const parseEntity = () => {
		return entity === 'username'
			? m.username()
			: entity === 'email'
				? m.email()
				: entity === 'domain'
					? m.domain()
					: m.control_watchlists_entity();
	};
	let currentEntity = $derived<string>(parseEntity());
	const parseAction = () => {
		return action === 'allow'
			? m.allow()
			: action === 'block'
				? m.block()
				: m.control_watchlists_action();
	};
	let currentAction = $derived<string>(parseAction());
	let term = $state<string>();
	const submitWatchlist: FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		try {
			const formData = new FormData(e.currentTarget);
			const valid = v.safeParse(v.string(), formData.get('term'));
			if (!valid.success) {
				toast.error(m.errors_settings_saving());
				console.error(valid.issues);
				return;
			}
			let domain: null | string = null;
			let username: null | string = null;
			const term = valid.output;
			switch (entity) {
				case 'domain': {
					// Must look like a bare domain (no @, has a dot)
					if (term.includes('@') || !/^[\w.-]+\.[a-z]{2,}$/i.test(term)) {
						toast.error(m.errors_domain_invalid());
						return;
					}
					domain = term.toLowerCase();
					break;
				}
				case 'email': {
					// Must look like a valid email
					if (!/^[\w.-]*@([\w-]+\.)+[\w-]{2,}$/.test(term)) {
						toast.error(m.errors_email_invalid());
						return;
					}
					[username, domain] = term.split('@');
					username = username ? username : '*';
					break;
				}
				case 'username': {
					// Must look like a username (no @, no dot-only domain style)
					if (/[@]/.test(term) || /^\w+\.\w+$/.test(term)) {
						toast.error(m.errors_username_invalid());
						return;
					}
					username = term;
					break;
				}
			}
			const id =
				domain && username
					? `${domain}:${username}`
					: domain
						? `domain:${domain}`
						: username
							? `username:${username}`
							: undefined;
			if (!id) {
				toast.error(m.errors_generic());
				return;
			}
			const allowed = action === 'allow' ? true : false;
			const payload = {
				allowed,
				domain,
				id,
				username
			};
			const mainQuery = addToWatchlist(payload);
			const override = <T,>(curr: T[]) => [...curr, payload as T];
			switch (entity) {
				case 'domain':
					mainQuery.updates(
						allowed
							? getDomainWhitelist({ limit, page }).withOverride(override)
							: getDomainBlacklist({ limit, page }).withOverride(override)
					);
					break;
				case 'email':
					mainQuery.updates(
						allowed
							? getEmailWhitelist({ limit, page }).withOverride(override)
							: getEmailBlacklist({ limit, page }).withOverride(override)
					);
					break;
				case 'username':
					mainQuery.updates(
						allowed
							? getUsernameWhitelist({ limit, page }).withOverride(override)
							: getUsernameBlacklist({ limit, page }).withOverride(override)
					);
					break;
				default:
					return;
			}
			const { success } = await mainQuery;
			if (success) toast.success(m.settings_saved());
			else toast.error(m.errors_settings_saving());
		} catch (error) {
			console.error('[watchlist] toolbar FE', error);
		}
	};
</script>

<Separator orientation="vertical" class="mx-1 h-11" />
<form onsubmit={submitWatchlist}>
	<ButtonGroup class="h-11 w-full gap-0 rounded-e-none border-t @md:border-0">
		<InputGroup.Root class="h-11 rounded-none border-none ps-1 pe-0!">
			<InputGroup.Addon align="inline-start" class="ps-1 pe-0">
				<PlusIcon />
			</InputGroup.Addon>
			<InputGroup.Input placeholder={m.control_watchlists_input()} name="term" bind:value={term} />
			<InputGroup.Addon align="inline-end" class="flex h-11 gap-0 p-0 pe-2">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<InputGroup.Button
								{...props}
								variant="ghost"
								class="h-11 rounded-none pr-1.5! @xl:text-xs"
							>
								{currentEntity || m.control_watchlists_entity()}
								<ChevronDownIcon class="size-3" />
							</InputGroup.Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="">
						<DropdownMenu.Group>
							<DropdownMenu.RadioGroup bind:value={entity}>
								<DropdownMenu.RadioItem value="domain">{m.domain()}</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="email">{m.email()}</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="username">{m.username()}</DropdownMenu.RadioItem>
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<InputGroup.Button
								{...props}
								variant="ghost"
								class="h-11 rounded-none pr-1.5! @xl:text-xs"
							>
								{currentAction || m.control_watchlists_action()}
								<ChevronDownIcon class="size-3" />
							</InputGroup.Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="">
						<DropdownMenu.Group>
							<DropdownMenu.RadioGroup bind:value={action}>
								<DropdownMenu.RadioItem value="allow">{m.allow()}</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="block">{m.block()}</DropdownMenu.RadioItem>
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</InputGroup.Addon>
		</InputGroup.Root>
		<Button
			type="submit"
			class="h-11 rounded-none border-0"
			variant="outline"
			disabled={!term ||
				!['allow', 'block'].includes(action) ||
				!['domain', 'email', 'username'].includes(entity)}
		>
			{m.save_changes()}
		</Button>
	</ButtonGroup>
</form>
