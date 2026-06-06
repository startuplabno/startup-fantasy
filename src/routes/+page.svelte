<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="mx-auto max-w-2xl py-12 text-center">
	<h1 class="text-4xl font-bold tracking-tight sm:text-5xl">World Cup Fantasy 2026</h1>
	<p class="mt-4 text-lg text-gray-600">
		Draft a starting XI from the real World Cup squads, lock it before kickoff, and climb one global
		leaderboard with the rest of the startup crowd.
	</p>

	<div class="mt-8 flex justify-center gap-3">
		{#if data.user}
			<a
				href={resolve('/team')}
				class="rounded-md bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
			>
				Go to your team
			</a>
		{:else}
			<a
				href={resolve('/login')}
				class="rounded-md bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
			>
				Sign in to play
			</a>
		{/if}
	</div>

	<ol class="mx-auto mt-12 max-w-md space-y-3 text-left text-gray-700">
		<li><span class="font-semibold text-green-700">1.</span> Sign up in seconds.</li>
		<li>
			<span class="font-semibold text-green-700">2.</span> Draft 11 players within a 100m budget.
		</li>
		<li>
			<span class="font-semibold text-green-700">3.</span> Lock your team before the first match.
		</li>
		<li>
			<span class="font-semibold text-green-700">4.</span> Watch points roll in and track your rank.
		</li>
	</ol>
</section>
