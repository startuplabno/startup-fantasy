<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import SoccerBall from '~icons/game-icons/soccer-ball';
	import SoccerKick from '~icons/game-icons/soccer-kick';
	import TShirt from '~icons/game-icons/t-shirt';
	import TrophyCup from '~icons/game-icons/trophy-cup';
	import ExitDoor from '~icons/game-icons/exit-door';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	const links = [
		{ href: '/draft', label: 'Draft', icon: SoccerKick },
		{ href: '/team', label: 'My Team', icon: TShirt },
		{ href: '/leaderboard', label: 'Leaderboard', icon: TrophyCup }
	] as const;
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col bg-gray-50 font-sans text-ink">
	<header class="sticky top-0 z-40 bg-ink text-white shadow-md">
		<nav class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
			<a
				href={resolve('/')}
				class="flex items-center gap-2 text-lg font-bold tracking-widest uppercase"
			>
				<SoccerBall class="h-6 w-6 text-brand" />
				Startup Fantasy
			</a>

			<div class="flex items-center gap-1 text-sm">
				{#if data.user}
					{#each links as link (link.href)}
						{@const Icon = link.icon}
						<a
							href={resolve(link.href)}
							class="flex items-center gap-1.5 rounded-md px-3 py-2 transition hover:bg-white/10 {page
								.url.pathname === link.href
								? 'font-semibold text-brand'
								: 'text-gray-300'}"
						>
							<Icon class="h-4 w-4" />
							{link.label}
						</a>
					{/each}
					<form method="post" action="/?/signOut" class="ml-2">
						<button
							class="flex items-center gap-1.5 rounded-md px-3 py-2 text-gray-300 transition hover:bg-white/10"
						>
							<ExitDoor class="h-4 w-4" />
							Sign out
						</button>
					</form>
				{:else}
					<a
						href={resolve('/login')}
						class="rounded-md bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark"
					>
						Log in
					</a>
				{/if}
			</div>
		</nav>
		<div class="h-1 bg-brand"></div>
	</header>

	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
		{@render children()}
	</main>

	<footer class="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
		We put founders first — even on the pitch.
	</footer>
</div>
