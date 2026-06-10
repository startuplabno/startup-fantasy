import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import {
	config,
	match,
	nationalTeam,
	player,
	playerMatchScore,
	playerMatchStat,
	teamSelection
} from './schema';
import type { Position } from '$lib/game/types';

/**
 * Loads the real player pool from API-Football (https://www.api-football.com)
 * and replaces the placeholder seed. API-Football has NO single "everything"
 * endpoint, so this makes one request for the tournament's teams and one per
 * team for its squad, then maps the result onto our minimal schema.
 *
 * It does NOT provide fantasy prices, so `value` is derived deterministically
 * from position + player id (see `valueFor`). Run with `pnpm db:ingest`.
 *
 * Runs outside Vite, so it builds its own DB connection from DATABASE_URL.
 */

const API_BASE = 'https://v3.football.api-sports.io';

const apiKey = process.env.API_FOOTBALL_KEY;
const leagueId = process.env.API_FOOTBALL_LEAGUE_ID ?? '1';
const season = process.env.API_FOOTBALL_SEASON ?? '2022';
// Free plan allows ~10 requests/minute; throttle to stay safely under it.
const requestDelayMs = Number(process.env.API_FOOTBALL_DELAY_MS ?? 7000);
// Extra national-team ids to include beyond the tournament's qualifiers, so we
// can add nations that didn't qualify (e.g. Norway=1090, Sweden=5).
const extraTeamIds = (process.env.API_FOOTBALL_EXTRA_TEAM_IDS ?? '1090,5')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean)
	.map(Number);

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL is not set');
if (!apiKey) throw new Error('API_FOOTBALL_KEY is not set');

const client = postgres(dbUrl);
const db = drizzle(client, { schema });

interface ApiTeam {
	team: { id: number; name: string };
}

interface ApiSquadPlayer {
	id: number;
	name: string;
	position: string;
}

interface ApiSquad {
	team: { id: number; name: string };
	players: ApiSquadPlayer[];
}

interface ApiResponse<T> {
	errors: unknown;
	results: number;
	response: T[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function slug(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** Map API-Football's position labels onto our four-way enum. */
function mapPosition(apiPosition: string): Position {
	switch (apiPosition) {
		case 'Goalkeeper':
			return 'GK';
		case 'Defender':
			return 'DEF';
		case 'Attacker':
			return 'FWD';
		case 'Midfielder':
		default:
			return 'MID';
	}
}

/**
 * Derive a stable fantasy value. The API has no prices, so we use a per-position
 * base plus deterministic jitter from the player id, keeping the budget mechanic
 * meaningful while staying reproducible across runs.
 */
function valueFor(position: Position, playerId: number): number {
	const base: Record<Position, number> = { GK: 5, DEF: 6, MID: 8, FWD: 10 };
	const jitter = playerId % 5; // 0..4
	return base[position] + jitter;
}

async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { 'x-apisports-key': apiKey! }
	});
	if (!res.ok) {
		throw new Error(`API ${path} failed: HTTP ${res.status} ${res.statusText}`);
	}
	const json = (await res.json()) as ApiResponse<T>;
	// API-Football returns errors as {} on success or a populated object/array.
	const errs = json.errors;
	const hasErrors = Array.isArray(errs) ? errs.length > 0 : errs && Object.keys(errs).length > 0;
	if (hasErrors) {
		throw new Error(`API ${path} returned errors: ${JSON.stringify(errs)}`);
	}
	return json;
}

/** Wipe the player pool and everything that references it, leaving users/config. */
async function wipePool() {
	await db.delete(playerMatchScore);
	await db.delete(playerMatchStat);
	await db.delete(teamSelection);
	await db.delete(match);
	await db.delete(player);
	await db.delete(nationalTeam);
}

// Add-only mode skips the tournament fetch + wipe and just appends the extra
// teams to the existing pool. Use it to add nations without re-fetching everyone.
const addOnly = ['1', 'true', 'yes'].includes(
	(process.env.API_FOOTBALL_ADD_ONLY ?? '').toLowerCase()
);

async function main() {
	let teamIds: number[];
	if (addOnly) {
		teamIds = [...new Set(extraTeamIds)];
		console.log(`Add-only mode: fetching ${teamIds.length} team(s): ${teamIds.join(', ')}.`);
	} else {
		console.log(`Fetching teams for league ${leagueId}, season ${season}…`);
		const teamsRes = await apiGet<ApiTeam>(`/teams?league=${leagueId}&season=${season}`);
		if (teamsRes.response.length === 0) {
			throw new Error('No teams returned — check league id, season, and plan coverage.');
		}
		console.log(`Found ${teamsRes.response.length} tournament teams.`);
		// Combine the tournament teams with any extra national teams, de-duplicated.
		teamIds = [...new Set([...teamsRes.response.map((t) => t.team.id), ...extraTeamIds])];
		if (extraTeamIds.length > 0) {
			console.log(`Including ${extraTeamIds.length} extra team(s): ${extraTeamIds.join(', ')}.`);
		}
	}

	const nations = new Map<string, { id: string; name: string }>();
	const players: {
		id: string;
		name: string;
		nationalTeamId: string;
		position: Position;
		value: number;
	}[] = [];

	for (let i = 0; i < teamIds.length; i++) {
		const teamId = teamIds[i];
		const squadRes = await apiGet<ApiSquad>(`/players/squads?team=${teamId}`);
		const squad = squadRes.response[0];
		if (!squad) {
			console.warn(`  [${i + 1}/${teamIds.length}] No squad for team ${teamId}, skipping.`);
		} else {
			const nationId = slug(squad.team.name);
			nations.set(nationId, { id: nationId, name: squad.team.name });
			console.log(`  [${i + 1}/${teamIds.length}] ${squad.team.name}: ${squad.players.length}`);
			for (const p of squad.players) {
				const position = mapPosition(p.position);
				players.push({
					id: String(p.id),
					name: p.name,
					nationalTeamId: nationId,
					position,
					value: valueFor(position, p.id)
				});
			}
		}
		if (i < teamIds.length - 1) await sleep(requestDelayMs);
	}

	console.log(`Collected ${players.length} players. Writing to database…`);

	// deadlineAt is NOT NULL; seed a far-future placeholder so it reads as "open"
	// until an admin sets the real deadline.
	await db
		.insert(config)
		.values({ id: 1, deadlineAt: new Date('2999-12-31T00:00:00Z') })
		.onConflictDoNothing();
	if (!addOnly) await wipePool();
	await db
		.insert(nationalTeam)
		.values([...nations.values()])
		.onConflictDoNothing();

	// Insert in batches to keep the parameter count well within Postgres limits.
	const batchSize = 500;
	for (let i = 0; i < players.length; i += batchSize) {
		await db
			.insert(player)
			.values(players.slice(i, i + batchSize))
			.onConflictDoNothing();
	}

	console.log(`Done. Seeded ${nations.size} nations and ${players.length} players.`);
	await client.end();
}

main().catch(async (err) => {
	console.error(err);
	await client.end();
	process.exit(1);
});
