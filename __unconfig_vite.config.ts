
let __unconfig_data;
let __unconfig_stub = function (data = {}) { __unconfig_data = data };
__unconfig_stub.default = (data = {}) => { __unconfig_data = data };
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const __unconfig_default =  defineConfig({
	plugins: [sveltekit()]
});

if (typeof __unconfig_default === "function") __unconfig_default(...[{"command":"serve","mode":"development"}]);export default __unconfig_data;