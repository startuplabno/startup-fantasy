<script lang="ts">
	import { resolve } from '$app/paths';
	import Padlock from '~icons/game-icons/padlock';
	import PencilRuler from '~icons/game-icons/pencil-ruler';
	import PlayerAvatar from '$lib/components/PlayerAvatar.svelte';
	import { nationFlagUrl } from '$lib/game/players';
	import { POSITIONS, POSITION_LABELS } from '$lib/game/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Rows top-to-bottom like a classic fantasy pitch: GK guards the top goal.
	const rows = $derived(
		POSITIONS.map((position) => ({
			position,
			players: data.players.filter((p) => p.position === position)
		}))
	);

	const formation = $derived(
		rows
			.filter((r) => r.position !== 'GK')
			.map((r) => r.players.length)
			.join('-')
	);

	/** "Mert Günok" -> "Günok"; what you'd print on the back of a shirt. */
	function shirtName(name: string): string {
		const parts = name.trim().split(/\s+/);
		return parts[parts.length - 1] ?? name;
	}
</script>

<section>
	{#if !data.team}
		<div class="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
			<h1 class="font-display text-2xl font-bold">Every great team starts with a draft</h1>
			<p class="mt-2 text-gray-600">Pick your starting XI and lock it before the deadline.</p>
			<a
				href={resolve('/draft')}
				class="mt-6 inline-block rounded-md bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand-dark"
			>
				Draft your team
			</a>
		</div>
	{:else}
		<!-- Scoreboard -->
		<div class="overflow-hidden rounded-t-xl bg-ink text-white">
			<div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
				<div class="min-w-0">
					<h1 class="truncate font-display text-2xl font-bold sm:text-3xl">{data.team.name}</h1>
					<p class="mt-1 flex items-center gap-2 text-xs text-gray-400">
						{#if data.team.status === 'locked'}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 font-semibold tracking-wider text-white uppercase"
							>
								<Padlock class="h-3 w-3" /> Locked
							</span>
							{#if data.team.lockedAt}
								{new Date(data.team.lockedAt).toLocaleString()}
							{/if}
						{:else}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold tracking-wider uppercase"
							>
								<PencilRuler class="h-3 w-3" /> Draft
							</span>
							not locked yet
						{/if}
					</p>
				</div>

				<div class="flex items-center gap-5">
					<div class="text-right">
						<div class="text-[10px] tracking-widest text-gray-400 uppercase">Formation</div>
						<div class="font-display text-xl font-bold">{formation}</div>
					</div>
					<div class="h-10 w-px bg-white/15"></div>
					<div class="text-right">
						<div class="text-[10px] tracking-widest text-gray-400 uppercase">Points</div>
						<div class="font-display text-xl font-bold text-brand">{data.totalPoints}</div>
					</div>
				</div>
			</div>
			<div class="h-1 bg-brand"></div>
		</div>

		<!-- Pitch -->
		<div class="pitch relative aspect-[4/5] w-full overflow-hidden rounded-b-xl sm:aspect-[16/11]">
			<!-- Markings -->
			<div class="pointer-events-none absolute inset-3 rounded-sm border-2 border-white/50">
				<!-- halfway line + center circle -->
				<div class="absolute top-1/2 right-0 left-0 border-t-2 border-white/50"></div>
				<div
					class="absolute top-1/2 left-1/2 aspect-square h-[22%] w-auto -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50"
				></div>
				<div
					class="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50"
				></div>
				<!-- penalty boxes -->
				<div
					class="absolute top-0 left-1/2 h-[16%] w-[44%] -translate-x-1/2 border-2 border-t-0 border-white/50"
				></div>
				<div
					class="absolute top-0 left-1/2 h-[6%] w-[20%] -translate-x-1/2 border-2 border-t-0 border-white/50"
				></div>
				<div
					class="absolute bottom-0 left-1/2 h-[16%] w-[44%] -translate-x-1/2 border-2 border-b-0 border-white/50"
				></div>
				<div
					class="absolute bottom-0 left-1/2 h-[6%] w-[20%] -translate-x-1/2 border-2 border-b-0 border-white/50"
				></div>
			</div>

			<!-- Formation rows -->
			<div class="absolute inset-0 grid grid-rows-4 py-4">
				{#each rows as row, rowIndex (row.position)}
					<div class="flex items-center justify-evenly px-2">
						{#each row.players as player, i (player.id)}
							{@const flag = nationFlagUrl(player.nation)}
							{@const pts = data.points[player.id] ?? 0}
							<div
								class="player-chip flex flex-col items-center"
								style="animation-delay: {(rowIndex * 4 + i) * 70}ms"
								title="{player.name} · {POSITION_LABELS[player.position]} · {player.value}m"
							>
								<div class="avatar-ring rounded-full bg-white p-0.5 shadow-md">
									<PlayerAvatar id={player.id} name={player.name} size={44} />
								</div>
								<div
									class="mt-1 flex max-w-20 items-center gap-1 rounded-sm bg-ink/90 px-1.5 py-0.5 shadow-sm sm:max-w-24"
								>
									{#if flag}
										<img src={flag} alt="" height="10" loading="lazy" class="h-2.5 w-auto" />
									{/if}
									<span class="truncate text-[10px] font-semibold text-white sm:text-xs">
										{shirtName(player.name)}
									</span>
								</div>
								<div
									class="mt-0.5 rounded-sm px-1.5 text-[10px] font-bold {pts > 0
										? 'bg-brand text-white'
										: 'bg-white/90 text-ink'}"
								>
									{pts} pts
								</div>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<div class="mt-4 flex items-center justify-between gap-4">
			<p class="text-xs text-gray-500">
				Points are computed by Novem after each match settles, so they read 0 until the tournament
				starts.
			</p>
			<a
				href={resolve('/draft')}
				class="shrink-0 rounded-md border border-brand px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-brand-pink"
			>
				Edit team
			</a>
		</div>
	{/if}
</section>

<style>
	.pitch {
		background-color: #2c8a4b;
		background-image: repeating-linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.06) 0,
			rgba(255, 255, 255, 0.06) 12.5%,
			rgba(0, 0, 0, 0.05) 12.5%,
			rgba(0, 0, 0, 0.05) 25%
		);
	}

	.player-chip {
		animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
		transition: transform 0.15s ease;
	}

	.player-chip:hover {
		transform: translateY(-3px) scale(1.06);
	}

	.player-chip:hover .avatar-ring {
		box-shadow: 0 0 0 2px var(--color-brand);
	}

	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.6);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.player-chip {
			animation: none;
		}
	}
</style>
