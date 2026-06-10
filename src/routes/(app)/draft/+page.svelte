<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { randomize, summarize, validate } from '$lib/game/squad';
	import { POSITIONS, POSITION_LABELS, RULES } from '$lib/game/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Seed editable state from the server once; the user edits locally after that.
	let selected = $state<string[]>(untrack(() => [...data.selectedIds]));
	let teamName = $state(untrack(() => data.teamName));

	// The player pool comes from the database via the load function.
	const byId = $derived(new Map(data.players.map((p) => [p.id, p])));
	const pool = $derived(
		POSITIONS.map((position) => ({
			position,
			players: data.players.filter((p) => p.position === position)
		}))
	);

	const selectedPlayers = $derived(
		selected.map((id) => byId.get(id)).filter((p) => p !== undefined)
	);
	const summary = $derived(summarize(selectedPlayers));
	const issues = $derived(validate(selectedPlayers));
	const full = $derived(selected.length >= RULES.size);
	const canLock = $derived(issues.length === 0 && teamName.trim().length > 0);
	const budgetPct = $derived(Math.min(100, (summary.spent / RULES.budget) * 100));

	function toggle(id: string) {
		if (selected.includes(id)) {
			selected = selected.filter((x) => x !== id);
		} else if (!full) {
			selected = [...selected, id];
		}
	}

	function randomizeTeam() {
		selected = randomize(data.players).map((p) => p.id);
	}
</script>

<section class="grid gap-6 lg:grid-cols-3">
	<!-- Player pool -->
	<div class="space-y-6 lg:col-span-2">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Build your XI</h1>
			<button
				type="button"
				onclick={randomizeTeam}
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
			>
				🎲 Randomize
			</button>
		</div>

		{#each pool as group (group.position)}
			<div>
				<h2 class="mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase">
					{POSITION_LABELS[group.position]}
					<span class="ml-1 text-gray-400">
						({summary.byPosition[group.position]}/{RULES.positions[group.position].min}–{RULES
							.positions[group.position].max})
					</span>
				</h2>
				<div class="grid gap-2 sm:grid-cols-2">
					{#each group.players as player (player.id)}
						{@const isSelected = selected.includes(player.id)}
						<button
							type="button"
							onclick={() => toggle(player.id)}
							disabled={!isSelected && full}
							class="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 {isSelected
								? 'border-green-600 bg-green-50'
								: 'border-gray-200 bg-white hover:border-gray-300'}"
						>
							<span>
								<span class="font-medium">{player.name}</span>
								<span class="block text-xs text-gray-500">{player.nation}</span>
							</span>
							<span class="font-semibold text-gray-700">{player.value}m</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Summary / lock -->
	<aside class="lg:sticky lg:top-6 lg:h-fit">
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
					placeholder="Go funny or go home"
					class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
				/>
			</div>

			<div>
				<div class="flex justify-between text-sm">
					<span class="font-medium">Budget</span>
					<span class={summary.remaining < 0 ? 'font-semibold text-red-600' : 'text-gray-600'}>
						{summary.remaining}m left
					</span>
				</div>
				<div class="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
					<div
						class="h-full {summary.remaining < 0 ? 'bg-red-500' : 'bg-green-500'}"
						style="width: {budgetPct}%"
					></div>
				</div>
			</div>

			<div class="flex justify-between text-sm">
				<span class="font-medium">Players</span>
				<span class="text-gray-600">{summary.count}/{RULES.size}</span>
			</div>

			{#if issues.length > 0}
				<ul class="space-y-1 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
					{#each issues as issue, i (i)}
						<li>{issue.message}</li>
					{/each}
				</ul>
			{:else}
				<p class="rounded-md bg-green-50 p-3 text-xs text-green-800">
					Squad is legal — ready to lock.
				</p>
			{/if}

			{#if form?.message}
				<p class="text-sm text-red-600">{form.message}</p>
			{/if}

			<input type="hidden" name="selection" value={JSON.stringify(selected)} />
			<button
				disabled={!canLock}
				class="w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
			>
				Lock team
			</button>
		</form>
	</aside>
</section>
