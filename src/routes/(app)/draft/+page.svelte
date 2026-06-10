<script lang="ts">
	import { untrack } from 'svelte';
	import { scale } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import Dice from '~icons/game-icons/perspective-dice-six-faces-random';
	import Padlock from '~icons/game-icons/padlock';
	import Swords from '~icons/game-icons/crossed-swords';
	import Shield from '~icons/game-icons/shield';
	import SoccerField from '~icons/game-icons/soccer-field';
	import { randomize, summarize, validate } from '$lib/game/squad';
	import PlayerAvatar from '$lib/components/PlayerAvatar.svelte';
	import { nationFlagUrl } from '$lib/game/players';
	import { POSITIONS, POSITION_LABELS, type Ownership, type Position } from '$lib/game/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Seed editable state from the server once; the user edits locally after that.
	let selected = $state<string[]>(untrack(() => [...data.selectedIds]));
	let teamName = $state(untrack(() => data.teamName));

	const rules = $derived(data.rules);
	// Infinite cap is sent as null over the wire; restore it for the rule logic.
	const ownership = $derived<Ownership>({
		counts: data.ownership.counts,
		cap: data.ownership.cap ?? Infinity
	});

	const byId = $derived(new Map(data.players.map((p) => [p.id, p])));
	const pool = $derived(
		POSITIONS.map((position) => ({
			position,
			players: data.players.filter((p) => p.position === position)
		}))
	);

	function ownedBy(id: string): number {
		return ownership.counts[id] ?? 0;
	}
	function atCap(id: string): boolean {
		return ownedBy(id) >= ownership.cap;
	}

	const selectedPlayers = $derived(
		selected.map((id) => byId.get(id)).filter((p) => p !== undefined)
	);
	const summary = $derived(summarize(selectedPlayers, rules.budget));
	const issues = $derived(validate(selectedPlayers, rules, ownership));
	const full = $derived(selected.length >= rules.size);
	const canLock = $derived(issues.length === 0 && teamName.trim().length > 0 && !data.pastDeadline);
	const budgetPct = $derived(Math.min(100, (summary.spent / rules.budget) * 100));

	// --- Tactics board ---------------------------------------------------

	/** 0 = park the bus, 100 = all-out attack. Drives the randomizer bias. */
	let attack = $state(50);
	let rolling = $state(false);

	const defense = $derived(100 - attack);

	const PRESETS: { label: string; attack: number }[] = [
		{ label: 'Park the Bus', attack: 10 },
		{ label: 'Counter', attack: 30 },
		{ label: 'Balanced', attack: 50 },
		{ label: 'Attacking', attack: 70 },
		{ label: 'All-Out', attack: 90 }
	];

	const tactic = $derived(
		attack < 20
			? 'Park the Bus'
			: attack < 40
				? 'Counter-Attack'
				: attack <= 60
					? 'Balanced'
					: attack <= 80
						? 'Attack-Minded'
						: 'All-Out Attack'
	);
	const tacticClass = $derived(
		attack > 60
			? 'bg-brand-pink text-brand-dark'
			: attack < 40
				? 'bg-mint text-forest'
				: 'bg-gray-100 text-gray-700'
	);

	const formationLabel = $derived(
		full
			? `${summary.byPosition.DEF}-${summary.byPosition.MID}-${summary.byPosition.FWD}`
			: null
	);

	// Where the money went: forwards + midfielders vs. keeper + defenders.
	const attackSpend = $derived(
		selectedPlayers
			.filter((p) => p.position === 'MID' || p.position === 'FWD')
			.reduce((sum, p) => sum + p.value, 0)
	);
	const defenseSpend = $derived(summary.spent - attackSpend);

	const PITCH_ORDER: Position[] = ['FWD', 'MID', 'DEF', 'GK'];
	const pitchRows = $derived(
		PITCH_ORDER.map((position) => ({
			position,
			players: selectedPlayers.filter((p) => p.position === position)
		}))
	);

	function lastName(name: string): string {
		return name.split(/\s+/).at(-1) ?? name;
	}

	function toggle(id: string) {
		if (data.pastDeadline || rolling) return;
		if (selected.includes(id)) {
			selected = selected.filter((x) => x !== id);
		} else if (!full && !atCap(id)) {
			selected = [...selected, id];
		}
	}

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	async function randomizeTeam() {
		if (data.pastDeadline || rolling) return;
		rolling = true;
		const picks = randomize(data.players, rules, ownership, { attack });
		// Stagger the reveal so the squad rolls in one player at a time.
		selected = [];
		await sleep(250);
		for (const pick of picks) {
			selected = [...selected, pick.id];
			await sleep(90);
		}
		rolling = false;
	}
</script>

<section class="grid gap-6 lg:grid-cols-3">
	<!-- Player pool -->
	<div class="space-y-6 lg:col-span-2">
		<div class="flex items-center justify-between">
			<h1 class="font-display text-3xl font-bold">Build your XI</h1>
			{#if formationLabel}
				<span
					class="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white"
					title="Current formation"
				>
					{formationLabel}
				</span>
			{/if}
		</div>

		{#if data.pastDeadline}
			<p class="rounded-md bg-brand-pink p-3 text-sm text-brand-dark">
				The deadline has passed. Teams are locked and can no longer be edited.
			</p>
		{/if}

		<!-- Tactics board -->
		<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
			<div class="flex items-center justify-between">
				<h2 class="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
					<SoccerField class="h-4 w-4" />
					Tactics board
				</h2>
				<span class="rounded-full px-3 py-1 text-xs font-semibold {tacticClass}">{tactic}</span>
			</div>

			<div class="space-y-3">
				<div>
					<div class="flex items-center justify-between text-sm">
						<span class="flex items-center gap-1.5 font-medium text-brand-dark">
							<Swords class="h-4 w-4" />
							Attack
						</span>
						<span class="font-semibold text-brand-dark">{attack}%</span>
					</div>
					<input
						type="range"
						min="0"
						max="100"
						bind:value={attack}
						disabled={data.pastDeadline || rolling}
						aria-label="Attack emphasis"
						class="w-full accent-brand"
					/>
				</div>
				<div>
					<div class="flex items-center justify-between text-sm">
						<span class="flex items-center gap-1.5 font-medium text-forest">
							<Shield class="h-4 w-4" />
							Defense
						</span>
						<span class="font-semibold text-forest">{defense}%</span>
					</div>
					<input
						type="range"
						min="0"
						max="100"
						value={defense}
						oninput={(e) => (attack = 100 - Number(e.currentTarget.value))}
						disabled={data.pastDeadline || rolling}
						aria-label="Defense emphasis"
						class="w-full accent-forest"
					/>
				</div>
			</div>

			<div class="flex flex-wrap gap-2">
				{#each PRESETS as preset (preset.label)}
					<button
						type="button"
						onclick={() => (attack = preset.attack)}
						disabled={data.pastDeadline || rolling}
						class="rounded-full border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 {attack ===
						preset.attack
							? 'border-ink bg-ink text-white'
							: 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'}"
					>
						{preset.label}
					</button>
				{/each}
			</div>

			<p class="text-xs text-gray-500">
				Attack-heavy rolls chase star forwards on a shoestring back line; defense-heavy rolls buy a
				fortress and bargain strikers.
			</p>

			<button
				type="button"
				onclick={randomizeTeam}
				disabled={data.pastDeadline || rolling}
				class="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
			>
				<Dice class="h-5 w-5 {rolling ? 'animate-spin' : ''}" />
				{rolling ? 'Rolling…' : 'Roll the dice'}
			</button>
		</div>

		{#each pool as group (group.position)}
			<div>
				<h2 class="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
					{POSITION_LABELS[group.position]}
					<span class="ml-1 text-gray-400">
						({summary.byPosition[group.position]}/{rules.positions[group.position].min}–{rules
							.positions[group.position].max})
					</span>
				</h2>
				<div class="grid gap-2 sm:grid-cols-2">
					{#each group.players as player (player.id)}
						{@const isSelected = selected.includes(player.id)}
						{@const capped = !isSelected && atCap(player.id)}
						{@const flag = nationFlagUrl(player.nation)}
						<button
							type="button"
							onclick={() => toggle(player.id)}
							disabled={data.pastDeadline || (!isSelected && (full || capped))}
							class="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 {isSelected
								? 'border-brand bg-brand-pink'
								: 'border-gray-200 bg-white hover:border-gray-300'}"
						>
							<span class="flex min-w-0 items-center gap-3">
								<PlayerAvatar id={player.id} name={player.name} />
								<span class="min-w-0">
									<span class="font-medium">{player.name}</span>
									<span class="flex items-center gap-1 text-xs text-gray-500">
										{#if flag}
											<img
												src={flag}
												alt=""
												height="12"
												loading="lazy"
												class="h-3 w-auto rounded-xs"
											/>
										{/if}
										{player.nation}{#if capped}<span class="text-brand"> · at cap</span>{/if}
									</span>
								</span>
							</span>
							<span class="font-semibold text-gray-700">{player.value}m</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Summary / lock -->
	<!-- top offset clears the sticky site header -->
	<aside class="space-y-4 lg:sticky lg:top-20 lg:h-fit">
		<!-- Mini pitch -->
		<div class="rounded-lg border border-gray-200 bg-white p-4">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-sm font-semibold tracking-wide text-gray-500 uppercase">Your XI</h2>
				{#if formationLabel}
					<span class="rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-forest">
						{formationLabel}
					</span>
				{/if}
			</div>
			<div
				class="relative overflow-hidden rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-800 p-3"
			>
				<!-- Pitch markings -->
				<div class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/30"></div>
				<div
					class="pointer-events-none absolute top-1/2 left-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
				></div>
				<div
					class="pointer-events-none absolute -top-2 left-1/2 h-8 w-24 -translate-x-1/2 rounded-b-md border border-white/30"
				></div>
				<div
					class="pointer-events-none absolute -bottom-2 left-1/2 h-8 w-24 -translate-x-1/2 rounded-t-md border border-white/30"
				></div>

				<div class="relative flex flex-col gap-2">
					{#each pitchRows as row (row.position)}
						<div class="flex min-h-12 flex-wrap items-center justify-center gap-x-2 gap-y-1">
							{#each row.players as player (player.id)}
								<div
									in:scale={{ duration: 250, start: 0.4 }}
									class="flex w-13 flex-col items-center gap-0.5"
								>
									<PlayerAvatar id={player.id} name={player.name} size={28} />
									<span class="max-w-full truncate text-[10px] leading-tight text-white">
										{lastName(player.name)}
									</span>
								</div>
							{/each}
						</div>
					{/each}
					{#if selected.length === 0}
						<p class="absolute inset-0 flex items-center justify-center text-center text-xs text-white/80">
							Pick players or roll the dice
						</p>
					{/if}
				</div>
			</div>

			{#if summary.spent > 0}
				<div class="mt-3">
					<div class="flex justify-between text-xs text-gray-500">
						<span class="font-medium text-brand-dark">Attack {attackSpend}m</span>
						<span class="font-medium text-forest">Defense {defenseSpend}m</span>
					</div>
					<div class="mt-1 flex h-2 overflow-hidden rounded-full bg-gray-100">
						<div class="bg-brand" style="width: {(attackSpend / summary.spent) * 100}%"></div>
						<div class="bg-forest" style="width: {(defenseSpend / summary.spent) * 100}%"></div>
					</div>
				</div>
			{/if}
		</div>

		<form
			method="post"
			action="?/lock"
			use:enhance
			class="space-y-4 rounded-lg border border-gray-200 bg-white p-4"
		>
			<div>
				<label class="block text-sm font-medium text-gray-700" for="teamName">Team name</label>
				<input
					id="teamName"
					name="teamName"
					bind:value={teamName}
					disabled={data.pastDeadline}
					placeholder="Go funny or go home"
					class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand focus:ring-2 focus:ring-brand focus:outline-none disabled:bg-gray-100"
				/>
			</div>

			<div>
				<div class="flex justify-between text-sm">
					<span class="font-medium">Budget</span>
					<span class={summary.remaining < 0 ? 'font-semibold text-brand' : 'text-gray-600'}>
						{summary.remaining}m left
					</span>
				</div>
				<div class="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
					<div
						class="h-full {summary.remaining < 0 ? 'bg-brand' : 'bg-forest'}"
						style="width: {budgetPct}%"
					></div>
				</div>
			</div>

			<div class="flex justify-between text-sm">
				<span class="font-medium">Players</span>
				<span class="text-gray-600">{summary.count}/{rules.size}</span>
			</div>

			{#if issues.length > 0}
				<ul class="space-y-1 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
					{#each issues as issue, i (i)}
						<li>{issue.message}</li>
					{/each}
				</ul>
			{:else}
				<p class="rounded-md bg-mint p-3 text-xs text-forest">Squad is legal — ready to lock.</p>
			{/if}

			{#if form?.message}
				<p class="text-sm text-brand-dark">{form.message}</p>
			{/if}

			<input type="hidden" name="selection" value={JSON.stringify(selected)} />
			<button
				disabled={!canLock}
				class="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
			>
				<Padlock class="h-4 w-4" />
				Lock team
			</button>
		</form>
	</aside>
</section>
