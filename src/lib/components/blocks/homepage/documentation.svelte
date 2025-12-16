<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { fly } from 'svelte/transition';

	import AppSidebar from './docs-sidebar.svelte';

	let { activeTab = $bindable() }: { activeTab: string } = $props();
</script>

<div transition:fly|global={{ y: 12 }}>
	<Sidebar.Provider>
		<AppSidebar />
		<Sidebar.Inset>
			<header class="flex h-14 shrink-0 items-center gap-2 border-b px-4 ps-0 p-0">
				<div class="w-14! grid place-content-center border-r h-14">
					<Sidebar.Trigger class="w-14 h-14" />
				</div>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item class="hidden md:block">
							<Breadcrumb.Link href="##">Building Your Application</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Data Fetching</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</header>
			<div class="flex flex-1 flex-col gap-4 p-4">
				<div class="grid auto-rows-min gap-4 md:grid-cols-3">
					<div class="bg-muted/50 aspect-video rounded-xl"></div>
					<div class="bg-muted/50 aspect-video rounded-xl"></div>
					<div class="bg-muted/50 aspect-video rounded-xl"></div>
				</div>
				<div class="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min"></div>
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
</div>
