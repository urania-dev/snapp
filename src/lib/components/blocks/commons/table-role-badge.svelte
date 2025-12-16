<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { m } from '$lib/paraglide/messages';

	const { class: classes, role }: { class?: string; role: string } = $props();

	const label = $derived(role === 'user' ? m.user() : m.admin());
</script>

<Badge
	variant={role === 'admin' ? 'default' : 'outline'}
	class={[
		'rounded-md h-7',
		role === 'admin' && 'bg-amber-500/10  border-amber-500/50 text-foreground',
		classes
	]}>{label}</Badge
>
