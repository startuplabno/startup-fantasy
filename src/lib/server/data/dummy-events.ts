import type { Position } from '../../game/types';
import type { playerMatchStat } from '../db/schema';

/**
 * Generates fake-but-plausible per-match player events so the scoring and
 * leaderboard pipeline can be built and demoed before a real stats feed exists.
 * Pure and deterministic: the same match id always yields the same events, so
 * runs are reproducible and testable. This is a DEV/DEMO tool — it is not real
 * data and is not meant for production.
 */

export type PlayerMatchStatRow = typeof playerMatchStat.$inferInsert;

export interface SquadMember {
	id: string;
	position: Position;
}

export interface DummyMatch {
	id: string;
	homeTeamId: string;
	awayTeamId: string;
}

export interface DummyEvents {
	stats: PlayerMatchStatRow[];
	finishedMatchIds: string[];
}

const MAX_GOALS = 4; // 0..3 per side
const MAX_YELLOWS = 4; // 0..3 per match
const RED_CARD_ODDS = 10; // ~1 in 10 matches

/** Deterministic 32-bit FNV-1a hash, so "randomness" is reproducible. */
function hash(text: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

/** Pick an element by hashing the seed — same seed, same pick. */
function pick<T>(items: T[], seed: string): T {
	return items[hash(seed) % items.length];
}

function blankRow(playerId: string, matchId: string): PlayerMatchStatRow {
	return {
		playerId,
		matchId,
		goals: 0,
		assists: 0,
		cleanSheet: false,
		yellows: 0,
		reds: 0,
		motm: false
	};
}

function eventsForMatch(
	match: DummyMatch,
	squads: Map<string, SquadMember[]>
): PlayerMatchStatRow[] {
	const home = squads.get(match.homeTeamId) ?? [];
	const away = squads.get(match.awayTeamId) ?? [];
	if (home.length === 0 || away.length === 0) return [];

	const rows = new Map<string, PlayerMatchStatRow>();
	const row = (id: string) => {
		let r = rows.get(id);
		if (!r) {
			r = blankRow(id, match.id);
			rows.set(id, r);
		}
		return r;
	};

	const homeGoals = hash(`${match.id}:hg`) % MAX_GOALS;
	const awayGoals = hash(`${match.id}:ag`) % MAX_GOALS;

	// Goals (and a coin-flip assist) go to attackers when the squad has them.
	const score = (team: SquadMember[], goals: number, side: string) => {
		const scorers = team.filter((p) => p.position === 'FWD' || p.position === 'MID');
		const pool = scorers.length > 0 ? scorers : team;
		for (let g = 0; g < goals; g++) {
			const scorer = pick(pool, `${match.id}:${side}:scorer:${g}`);
			row(scorer.id).goals! += 1;
			if (team.length > 1 && hash(`${match.id}:${side}:assist:${g}`) % 2 === 0) {
				let assister = pick(team, `${match.id}:${side}:assister:${g}`);
				if (assister.id === scorer.id) assister = pick(team, `${match.id}:${side}:assister2:${g}`);
				if (assister.id !== scorer.id) row(assister.id).assists! += 1;
			}
		}
	};
	score(home, homeGoals, 'H');
	score(away, awayGoals, 'A');

	// Clean sheet: every GK/DEF of a side that conceded zero (game-mechanics §6.4).
	const cleanSheet = (team: SquadMember[], conceded: number) => {
		if (conceded !== 0) return;
		for (const p of team)
			if (p.position === 'GK' || p.position === 'DEF') row(p.id).cleanSheet = true;
	};
	cleanSheet(home, awayGoals);
	cleanSheet(away, homeGoals);

	// A few yellows, and the occasional red, spread across both squads.
	const everyone = [...home, ...away];
	const yellows = hash(`${match.id}:yc`) % MAX_YELLOWS;
	for (let y = 0; y < yellows; y++) row(pick(everyone, `${match.id}:yellow:${y}`).id).yellows! += 1;
	if (hash(`${match.id}:rc`) % RED_CARD_ODDS === 0)
		row(pick(everyone, `${match.id}:red`).id).reds! += 1;

	// One man of the match, taken from the side that didn't lose.
	const winners = homeGoals >= awayGoals ? home : away;
	row(pick(winners, `${match.id}:motm`).id).motm = true;

	return [...rows.values()];
}

/** Build events for every given match. Matches with an unknown squad are skipped. */
export function dummyEvents(
	matches: DummyMatch[],
	squads: Map<string, SquadMember[]>
): DummyEvents {
	const stats: PlayerMatchStatRow[] = [];
	const finishedMatchIds: string[] = [];
	for (const match of matches) {
		const rows = eventsForMatch(match, squads);
		if (rows.length === 0) continue;
		stats.push(...rows);
		finishedMatchIds.push(match.id);
	}
	return { stats, finishedMatchIds };
}
