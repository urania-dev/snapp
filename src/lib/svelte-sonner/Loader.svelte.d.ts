interface $$__sveltets_2_IsomorphicComponent<
	Props extends Record<string, any> = any,
	Events extends Record<string, any> = any,
	Slots extends Record<string, any> = any,
	Exports = {},
	Bindings = string
> {
	new (
		options: import('svelte').ComponentConstructorOptions<Props>
	): import('svelte').SvelteComponent<Props, Events, Slots> & {
		$$bindings?: Bindings;
	} & Exports;
	(
		internal: unknown,
		props: Props & {
			$$events?: Events;
			$$slots?: Slots;
		}
	): Exports;
	z_$$bindings?: Bindings;
}
declare const Loader: $$__sveltets_2_IsomorphicComponent<
	{
		visible: boolean;
	},
	{
		[evt: string]: CustomEvent<any>;
	},
	{},
	{},
	''
>;
type Loader = InstanceType<typeof Loader>;
export default Loader;
