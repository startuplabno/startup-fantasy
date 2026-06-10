<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="mx-auto max-w-3xl py-12 text-center">
	<p class="text-sm font-semibold tracking-widest text-brand uppercase">World Cup 2026</p>
	<h1 class="mt-3 font-display text-4xl font-bold tracking-tight sm:text-6xl">
		Build something. <span class="text-brand">Win something.</span>
	</h1>
	<p class="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
		We've taken the World Cup and turned it into your next venture: draft a starting XI from the
		real squads, lock it before kickoff, and climb one global leaderboard with the rest of the
		startup crowd.
	</p>

	<div class="mt-8 flex justify-center gap-3">
		{#if data.user}
			<a
				href={resolve('/team')}
				class="rounded-md bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand-dark"
			>
				Go to your team
			</a>
		{:else}
			<a
				href={resolve('/login')}
				class="rounded-md bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand-dark"
			>
				Sign in to play
			</a>
		{/if}
	</div>

	<ol class="mx-auto mt-14 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
		{#each [{ step: '01', title: 'Sign up in seconds', detail: 'No pitch deck required.' }, { step: '02', title: 'Draft 11 players', detail: 'Spend your 100m budget like it came from our Founders Fund.' }, { step: '03', title: 'Lock before kickoff', detail: 'Ship it before the first whistle — deadlines are real here too.' }, { step: '04', title: 'Climb the board', detail: 'Watch points roll in and track your rank against the ecosystem.' }] as item (item.step)}
			<li class="rounded-lg border border-gray-200 bg-white p-5">
				<span class="font-display text-2xl font-bold text-brand">{item.step}</span>
				<p class="mt-2 font-semibold">{item.title}</p>
				<p class="mt-1 text-sm text-gray-600">{item.detail}</p>
			</li>
		{/each}
	</ol>
</section>
