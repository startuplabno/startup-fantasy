<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const field =
		'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none';
</script>

<section class="mx-auto max-w-sm py-8">
	<h1 class="font-display text-3xl font-bold">Join the league</h1>
	<p class="mt-1 text-sm text-gray-600">
		Email and password for now. Google sign-in is planned for launch.
	</p>

	<form method="post" use:enhance class="mt-6 space-y-4">
		<label class="block text-sm font-medium text-gray-700">
			Email
			<input type="email" name="email" required value={form?.email ?? ''} class={field} />
		</label>

		<label class="block text-sm font-medium text-gray-700">
			Password
			<input type="password" name="password" required class={field} />
		</label>

		<label class="block text-sm font-medium text-gray-700">
			Team manager name <span class="text-gray-400">(new accounts)</span>
			<input name="name" value={form?.name ?? ''} class={field} />
		</label>

		{#if form?.message}
			<p class="rounded-md bg-brand-pink p-3 text-sm text-brand-dark">{form.message}</p>
		{/if}

		<div class="flex gap-3 pt-2">
			<button
				formaction="?/signIn"
				class="flex-1 rounded-md bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark"
			>
				Log in
			</button>
			<button
				formaction="?/signUp"
				class="flex-1 rounded-md border border-brand px-4 py-2 font-medium text-brand-dark transition hover:bg-brand-pink"
			>
				Create account
			</button>
		</div>
	</form>
</section>
