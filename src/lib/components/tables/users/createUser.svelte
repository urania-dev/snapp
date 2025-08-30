<script lang="ts">
	import { createUserSchema, type CreateUserSchema } from "$lib/components/auth/schema";
	import P from "$lib/components/typography/text/p.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Form from "$lib/components/ui/form";
	import { Input } from "$lib/components/ui/input";
	import * as Select from "$lib/components/ui/select";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { decode } from "html-entities";
	import { toast } from "svelte-sonner";
	import { type Infer, superForm, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";

	let {
		createForm,
		open = $bindable()
	}: { createForm: SuperValidated<Infer<CreateUserSchema>>; open: boolean } = $props();

	const form = superForm(createForm, {
		invalidateAll: true,
		onResult: ({ result }) => {
			if (result.status === 200) open = false;
			else toast.error(i18n.t("errors.auth.email-registered"));
		},
		resetForm: false,
		validationMethod: "onsubmit",
		validators: zodClient(createUserSchema)
	});

	const { enhance: superEnhance, form: formData } = form;
	const i18n = getTranslations();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-sm">
		<Dialog.Header>
			<Dialog.Title>{i18n.t("users.labels.create")}</Dialog.Title>
			<Dialog.Description class="text-balance pt-4">
				<P class="font-sm mb-4 leading-snug text-muted-foreground"
					>{decode(i18n.t("users.helpers.invitation"))}</P
				>
				<form method="post" action="?/create" use:superEnhance>
					<Form.Field {form} name="username">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{i18n.t("users.fields.username")}</Form.Label>
								<Input
									icon="user"
									placeholder="{i18n.t('users.fields.username')}..."
									{...props}
									bind:value={$formData.username}
									oninput={(e) => {
										$formData.username = e.currentTarget.value
											.toLowerCase()
											.replace(/\s+/g, "-")
											.replace(/[^a-z0-9_-]/g, "")
											.replace(/-+/g, "-");
									}}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{i18n.t("users.fields.email")}</Form.Label>
								<Input
									icon="envelope"
									placeholder="{i18n.t('users.fields.email')}..."
									{...props}
									bind:value={$formData.email}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field name="role" {form}>
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{i18n.t("users.fields.role")}</Form.Label>
								<Select.Root type="single" bind:value={$formData.role} {...props}>
									<Select.Trigger
										aria-label={i18n.t("users.helpers.admin")}
										class="w-full capitalize">{$formData.role}</Select.Trigger
									>
									<Select.Content class="max-h-[200px] overflow-y-auto">
										<Select.Item
											class="capitalize"
											value="user"
											label={i18n.t("users.roles.user")}
										/>
										<Select.Item
											class="capitalize"
											value="admin"
											label={i18n.t("users.roles.admin")}
										/>
										<Select.Item
											class="capitalize"
											value="root"
											label={i18n.t("users.roles.root")}
										/>
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
					</Form.Field>
					<Button class="mt-4 w-full" type="submit">{i18n.t("globals.save")}</Button>
				</form>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
