<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	import AppSidebarHeader from '../sidebar/app-sidebar-header.svelte';
	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
	import { page } from '$app/state';

	const data = {
		navMain: [
			{
				items: [
					{
						isActive: page.url.hash === '#getting-started/installation',
						slug: 'installation',
						title: 'Installation'
					},
					{
						isActive: page.url.hash === '#getting-started/configuration',
						slug: 'configuration',
						title: 'Configuration'
					}
				],
				slug: 'getting-started',
				title: 'Getting Started'
			},
			{
				items: [
					{
						isActive: page.url.hash === '#features/custom-urls',
						slug: 'custom-urls',
						title: 'Custom URL'
					},
					{
						isActive: page.url.hash === '#features/authentication',
						slug: 'authentication',
						title: 'Authentication'
					},
					{
						isActive: page.url.hash === '#features/organizations',
						slug: 'organizations',
						title: 'Organizations'
					},
					{
						isActive: page.url.hash === '#features/teams',
						slug: 'teams',
						title: 'Teams'
					},
					{
						isActive: page.url.hash === '#features/authorization-policies',
						slug: 'authorization-policies',
						title: 'Authorization Policies'
					},
					{
						isActive: page.url.hash === '#features/metrics',
						slug: 'metrics',
						title: 'Metrics'
					},
					{
						isActive: page.url.hash === '#features/styling',
						slug: 'styling',
						title: 'Styling'
					},
					{
						isActive: page.url.hash === '#features/third-party-integrations',
						slug: 'third-party-integrations',
						title: 'Third-Party Integrations'
					}
				],
				slug: 'features',
				title: 'Features'
			},
			{
				items: [
					{
						isActive: page.url.hash === '#api-reference/open-api-specifications',
						slug: 'open-api-specifications',
						title: 'OpenAPI Specifications'
					},
					{
						isActive: page.url.hash === '#api-reference/scalar-api-client',
						slug: 'scalar-api-client',
						title: 'Scalar API Client'
					}
				],
				slug: 'api-reference',
				title: 'API Reference'
			},
			{
				items: [
					{
						isActive: page.url.hash === '#cli/installation',
						slug: 'installation',
						title: 'Installation'
					},
					{
						isActive: page.url.hash === '#cli/configuration',
						slug: 'configuration',
						title: 'Configuration'
					},
					{
						isActive: page.url.hash === '#cli/usage',
						slug: 'usage',
						title: 'Usage'
					}
				],
				slug: 'cli',
				title: 'Snapp CLI'
			}
		]
	};
</script>

<Sidebar.Root {...restProps} bind:ref>
	<AppSidebarHeader
		appname={page.data.appname}
		host={page.data.host}
		logo={page.data.activeOrganization?.logo}
	/>
	<Sidebar.Content>
		<!-- We create a Sidebar.Group for each parent. -->
		{#each data.navMain as group (group.title)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.title}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.items as item (item.title)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={item.isActive}>
									{#snippet child({ props })}
										<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
										<a href="#{group.slug}/{item.slug}" {...props}>{item.title}</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
