<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	const links = [
		{ href: '/draft', label: 'Draft' },
		{ href: '/team', label: 'My Team' },
		{ href: '/leaderboard', label: 'Leaderboard' }
	] as const;
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen flex-col bg-gray-50 text-gray-900">
	<header class="border-b border-gray-200 bg-white">
		<nav class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
			<a href={resolve('/')} class="text-lg font-bold tracking-tight"> ⚽ Startup Fantasy </a>

			<div class="flex items-center gap-1 text-sm">
				{#if data.user}
					{#each links as link (link.href)}
						<a
							href={resolve(link.href)}
							class="rounded-md px-3 py-2 hover:bg-gray-100 {page.url.pathname === link.href
								? 'font-semibold text-green-700'
								: 'text-gray-600'}"
						>
							{link.label}
						</a>
					{/each}
					<form method="post" action="/?/signOut" class="ml-2">
						<button class="rounded-md px-3 py-2 text-gray-600 hover:bg-gray-100">Sign out</button>
					</form>
				{:else}
					<a
						href={resolve('/login')}
						class="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
					>
						Log in
					</a>
				{/if}
			</div>
		</nav>
	</header>

	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
		{@render children()}
	</main>
</div>
