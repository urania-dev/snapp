<script lang="ts">
	import ShieldIcon from 'lucide-svelte/icons/shield';

	import { Small } from '$lib/ui/typography';
	import { intlFormatDistance } from 'date-fns';

	export let locale: string, row: Partial<DBSnapp>, user: DBUser, users: DBUser[];

	function getRelativeDate(date: Date) {
		const rel = intlFormatDistance(date, new Date(), { locale });
		return rel;
	}

	export let handle_author: () => void;
</script>

<tr data-idx={row.id} class="pe-0">
	<td class="cursor-default w-10" title={row.original_url}>
		<Small class="whitespace-nowrap text-ellipsis overflow-hidden max-w-24 flex">
			{row.original_url}
		</Small>
	</td>

	<td>
		{row.shortcode}
	</td>
	<td>
		<div class="text-center flex justify-start">
			<ShieldIcon class="w-4 h-4" fill="currentColor" />
		</div>
	</td>

	<td>
		<Small class="whitespace-nowrap">
			{#if row.created}
				{getRelativeDate(row.created)}
			{/if}
		</Small>
	</td>
	<td class="text-end">
		<select
			class="select inline-flex max-w-max variant-glass-secondary h-8 leading-none text-sm font-semibold"
			bind:value={row.user_id}
			on:change={handle_author}
			data-idx={row.id}
		>
			<option value={user.id} class="rounded-none text-sm">
				{user.username}
			</option>
			{#each users as _user}
				<option value={_user.id} class="rounded-none text-sm">
					{_user.username}
				</option>
			{/each}
		</select>
	</td>
</tr>

<style lang="postcss">
	td:last-child{
		@apply pe-0;
	}
</style>