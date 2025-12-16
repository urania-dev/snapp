<script lang="ts">
	import type { IconProps } from '@lucide/svelte';
	import type { Component } from 'svelte';

	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { resolve } from '$app/paths';
	import * as Collapsible from '$lib/components/ui/collapsible/index';
	import * as Sidebar from '$lib/components/ui/sidebar/index';

	let {
		groupLabel,
		items
	}: {
		groupLabel?: string;
		items: {
			hidden?: boolean;
			icon?: Component<IconProps>;
			isActive?: boolean;
			items?: {
				isActive?: boolean;
				title: string;
				url: string;
			}[];
			title: string;
			url: ReturnType<typeof resolve>;
		}[];
	} = $props();
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel class="empty:hidden">{groupLabel}</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as item, idx (`${item.title}${idx}`)}
			{#if !item.hidden}
				<Collapsible.Root open={item.isActive} class="group/collapsible">
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a href={item.url}>
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuButton
											{...props}
											class="h-10 group-data-[collapsible=icon]:w-full!"
											tooltipContent={item.title}
											isActive={item.isActive}
										>
											{#if item.icon}
												<item.icon class="group-data-[collapsible=icon]:hiddenms-auto size-5!" />
											{/if}
											<span class="group-data-[collapsible=icon]:hidden">{item.title}</span>
											{#if item.items?.length}
												<ChevronRightIcon
													class="ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90"
												/>
											{/if}
										</Sidebar.MenuButton>
									{/snippet}
								</Collapsible.Trigger>
							</a>
							<Collapsible.Content>
								{#if item.items?.length}
									<Sidebar.MenuSub>
										{#each item.items ?? [] as subItem (subItem.title)}
											<Sidebar.MenuSubItem>
												<Sidebar.MenuSubButton isActive={subItem.isActive}>
													{#snippet child({ props })}
														<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
														<a href={subItem.url} {...props}>
															<span>{subItem.title}</span>
														</a>
													{/snippet}
												</Sidebar.MenuSubButton>
											</Sidebar.MenuSubItem>
										{/each}
									</Sidebar.MenuSub>
								{/if}
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
