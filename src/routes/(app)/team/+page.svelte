<script lang="ts">
	import { resolve } from '$app/paths';
	import { POSITIONS, POSITION_LABELS } from '$lib/game/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const byPosition = $derived(
		POSITIONS.map((position) => ({
			position,
			players: data.players.filter((p) => p.position === position)
		}))
	);
</script>

<section>
	{#if !data.team}
		<div class="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
			<h1 class="text-xl font-semibold">You haven't picked a team yet</h1>
			<p class="mt-2 text-gray-600">Draft your starting XI and lock it before the deadline.</p>
			<a
				href={resolve('/draft')}
				class="mt-6 inline-block rounded-md bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
			>
				Draft your team
			</a>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold">{data.team.name}</h1>
				<p class="mt-1 text-sm text-gray-600">
					{#if data.team.status === 'locked'}
						Locked{data.team.lockedAt ? ` ${new Date(data.team.lockedAt).toLocaleString()}` : ''}
					{:else}
						Draft — not locked yet
					{/if}
				</p>
			</div>
			<div class="text-right">
				<div class="text-3xl font-bold text-green-700">{data.totalPoints}</div>
				<div class="text-xs text-gray-500">total points</div>
			</div>
		</div>

		<p class="mt-2 text-sm text-gray-500">
			Points are computed by Novem after each match settles, so they read 0 until the tournament
			starts.
		</p>

		<div class="mt-6 space-y-6">
			{#each byPosition as group (group.position)}
				<div>
					<h2 class="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
						{POSITION_LABELS[group.position]}
					</h2>
					<ul
						class="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white"
					>
						{#each group.players as player (player.id)}
							<li class="flex items-center justify-between px-4 py-3">
								<div>
									<span class="font-medium">{player.name}</span>
									<span class="ml-2 text-sm text-gray-500">{player.nation}</span>
								</div>
								<span class="text-sm font-medium text-gray-600"
									>{data.points[player.id] ?? 0} pts</span
								>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<a href={resolve('/draft')} class="mt-6 inline-block text-sm text-green-700 hover:underline">
			Edit team
		</a>
	{/if}
</section>
