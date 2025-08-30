<script lang="ts">
	import type { Setting, User } from "@prisma/client";

	import { page } from "$app/state";
	import { type Infer, type SuperValidated } from "sveltekit-superforms";

	import { type ProfileSchema } from "../schema";
	import EnableMfa from "./enableMFA.svelte";
	import UserProfileForm from "./form.svelte";
	import ResetPassword from "./resetPassword.svelte";
	import SelectLanguage from "./selectLanguage.svelte";
	import Theme from "./theme.svelte";

	const {
		availableLanguages = "en",
		privates,
		profileForm,
		serverSideEnabledMFA,
		user
	}: {
		availableLanguages?: string;
		privates: Setting[];
		profileForm: SuperValidated<Infer<ProfileSchema>>;
		serverSideEnabledMFA: boolean;
		user: User;
	} = $props();

	let theme = $state(page.data.theme);
	let language = $state(page.data.locale);

	const getPrivate = (label: string) =>
		privates.find((p) => p.field === label)?.value.toLowerCase();

	let enableMFA = $derived(
		(serverSideEnabledMFA as boolean) === true || getPrivate("ENABLED_MFA") === "true"
	);
</script>

<div class="flex h-max w-full flex-col gap-2 md:gap-4">
	<UserProfileForm {profileForm} {user} />
	<ResetPassword />
	<SelectLanguage {availableLanguages} {language} />
	<Theme {theme} />
	<EnableMfa tfs={user.tfs !== null} {serverSideEnabledMFA} {enableMFA} />
</div>
