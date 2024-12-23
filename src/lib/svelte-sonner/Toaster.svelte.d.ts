import type { ToasterProps } from "./types.js";
interface $$__sveltets_2_IsomorphicComponent<
  Props extends Record<string, any> = any,
  Events extends Record<string, any> = any,
  Slots extends Record<string, any> = any,
  Exports = {},
  Bindings = string,
> {
  new (
    options: import("svelte").ComponentConstructorOptions<Props>,
  ): import("svelte").SvelteComponent<Props, Events, Slots> & {
    $$bindings?: Bindings;
  } & Exports;
  (
    internal: unknown,
    props: Props & {
      $$events?: Events;
      $$slots?: Slots;
    },
  ): Exports;
  z_$$bindings?: Bindings;
}
declare const Toaster: $$__sveltets_2_IsomorphicComponent<
  ToasterProps,
  {
    [evt: string]: CustomEvent<any>;
  },
  {},
  {},
  ""
>;
type Toaster = InstanceType<typeof Toaster>;
export default Toaster;
