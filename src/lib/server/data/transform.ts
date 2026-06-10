import { assert } from '../../assert';
import type { Position } from '../../game/types';
import type { nationalTeam, player, match } from '../db/schema';

/**
 * Turns the football-data.org feed (saved as fixtures, see ./fixtures) into rows
 * ready for the database. Pure: feed in, rows out, no I/O. The seed script
 * (scripts/seed.ts) does the talking to Postgres; the logic that can go wrong —
 * mapping positions, pricing players, deriving gameweeks — lives here so it can
 * be tested against the real fixtures without a database.
 */

export type NationalTeamRow = typeof nationalTeam.$inferInsert;
export type PlayerRow = typeof player.$inferInsert;
export type MatchRow = typeof match.$inferInsert;

// --- Feed shapes (only the fields we read; see src/lib/server/data/fixtures) ---

export interface FeedTeam {
	id: number;
	name: string;
	tla: string;
	squad: { id: number; name: string; position: string }[];
}

export interface FeedMatch {
	id: number;
	utcDate: string;
	status: string;
	stage: string;
	matchday: number | null;
	homeTeam: { tla: string | null; name: string | null };
	awayTeam: { tla: string | null; name: string | null };
}

// --- Positions -------------------------------------------------------------

// The feed groups every squad member under one of four sections. They map
// cleanly onto our four positions; anything else (e.g. a stray "Coach" entry)
// is not a player and is dropped by toPlayers below.
const POSITION_BY_SECTION: Record<string, Position> = {
	Goalkeeper: 'GK',
	Defence: 'DEF',
	Midfield: 'MID',
	Offence: 'FWD'
};

// --- Pricing ---------------------------------------------------------------

// The feed has no player value, so we derive one. Forwards start dearest and
// keepers cheapest, then each player gets a fixed step up from a hash of their
// id. Same id always gives the same price (no randomness), and the spread makes
// the 100m budget an actual constraint rather than a formality. This is a
// placeholder pricing pass — see docs/game-mechanics.md §6.2; real values can
// replace it later without touching anything else.
const BASE_VALUE: Record<Position, number> = { GK: 4, DEF: 5, MID: 6, FWD: 7 };
const PRICE_STEPS = 11; // 0..10 steps of 0.5m → up to +5.0m on top of the base

/** Deterministic 32-bit FNV-1a hash of a string. */
function hash(text: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

export function priceFor(position: Position, playerId: string): number {
	const step = hash(playerId) % PRICE_STEPS;
	return BASE_VALUE[position] + step * 0.5;
}

// --- Gameweeks -------------------------------------------------------------

// A "gameweek" is one round of the group stage, then each knockout round
// (docs/game-mechanics.md §6.8). Group matchdays 1–3 are gameweeks 1–3; the
// knockout rounds follow on. Third-place and the final share the last gameweek
// since they are played on the same weekend.
const KNOCKOUT_GAMEWEEK: Record<string, number> = {
	LAST_32: 4,
	LAST_16: 5,
	QUARTER_FINALS: 6,
	SEMI_FINALS: 7,
	THIRD_PLACE: 8,
	FINAL: 8
};

export function gameweekFor(stage: string, matchday: number): number {
	if (stage === 'GROUP_STAGE') {
		assert(matchday >= 1 && matchday <= 3, `group matchday out of range: ${matchday}`);
		return matchday;
	}
	const gameweek = KNOCKOUT_GAMEWEEK[stage];
	assert(gameweek !== undefined, `unknown stage: ${stage}`);
	return gameweek;
}

// --- Match status ----------------------------------------------------------

// Our schema cares about three states; the feed has more. Map the ones that
// occur in a tournament and treat anything unstarted as scheduled.
const MATCH_STATUS: Record<string, MatchRow['status']> = {
	SCHEDULED: 'scheduled',
	TIMED: 'scheduled',
	POSTPONED: 'scheduled',
	SUSPENDED: 'scheduled',
	IN_PLAY: 'live',
	PAUSED: 'live',
	FINISHED: 'finished',
	AWARDED: 'finished'
};

function statusFor(feedStatus: string): MatchRow['status'] {
	return MATCH_STATUS[feedStatus] ?? 'scheduled';
}

// --- Transforms ------------------------------------------------------------

/** One row per nation, keyed by its ISO-3 code (the feed's `tla`). */
export function toNationalTeams(teams: FeedTeam[]): NationalTeamRow[] {
	return teams.map((team) => {
		assert(team.tla, `team ${team.name} has no tla`);
		return { id: team.tla, name: team.name, status: 'in' };
	});
}

/** Every squad member that maps to a playing position, priced and tied to its nation. */
export function toPlayers(teams: FeedTeam[]): PlayerRow[] {
	const rows: PlayerRow[] = [];
	for (const team of teams) {
		assert(team.tla, `team ${team.name} has no tla`);
		for (const member of team.squad) {
			const position = POSITION_BY_SECTION[member.position];
			if (!position) continue; // not a player (e.g. a coach listed in the squad)
			const id = String(member.id);
			rows.push({
				id,
				name: member.name,
				nationalTeamId: team.tla,
				position,
				value: priceFor(position, id)
			});
		}
	}
	return rows;
}

/**
 * Matches whose teams are known. Knockout fixtures exist in the feed before the
 * draw, but with empty teams — they cannot reference a nation yet, so they are
 * left out until the bracket fills in. Today that means the 72 group-stage
 * matches; the rest seed on a later refresh.
 */
export function toMatches(matches: FeedMatch[]): MatchRow[] {
	const rows: MatchRow[] = [];
	for (const m of matches) {
		const home = m.homeTeam.tla;
		const away = m.awayTeam.tla;
		if (!home || !away) continue; // teams not drawn yet
		rows.push({
			id: String(m.id),
			homeTeamId: home,
			awayTeamId: away,
			kickoffAt: new Date(m.utcDate),
			status: statusFor(m.status),
			gameweek: gameweekFor(m.stage, m.matchday)
		});
	}
	return rows;
}
