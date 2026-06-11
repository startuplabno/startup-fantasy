import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray, sql } from 'drizzle-orm';
import * as schema from '../src/lib/server/db/schema';
import { RULES, type Player, type Position, type SquadRules } from '../src/lib/game/types';
import { dummyEvents, type SquadMember } from '../src/lib/server/data/dummy-events';

/**
 * DEV ONLY. Fills the local database with a handful of demo teams and fake
 * match events so the scoring/leaderboard pipeline can be built and demoed
 * before real teams and a stats feed exist. Idempotent and deterministic.
 * Run after `pnpm db:seed` with: pnpm db:seed:demo. Never run against real data.
 */

const DEMO_TEAMS = [
	'Offside Founders',
	'Bench Capital',
	'xG Ventures',
	'Tiki-Taka Tech',
	'The Cap Table',
	'Gegenpress AS',
	'Extra Time Equity',
	'Hat-trick Holdings',
	'Stoppage Time',
	'Last Place Labs'
];

/** Deterministic 32-bit FNV-1a hash. */
function hash(text: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

/**
 * Greedily build one legal 1-4-4-2 XI from the pool, respecting the nation cap
 * and budget. Deterministic per `seed`; retries with a fresh shuffle if a
 * random order can't be filled within budget.
 */
function pickSquad(pool: Player[], rules: SquadRules, seed: string): Player[] {
	const formation: Record<Position, number> = { GK: 1, DEF: 4, MID: 4, FWD: 2 };
	for (let attempt = 0; attempt < 40; attempt++) {
		const picks: Player[] = [];
		const nationCount: Record<string, number> = {};
		let spent = 0;
		let complete = true;
		for (const position of ['GK', 'DEF', 'MID', 'FWD'] as Position[]) {
			const eligible = pool
				.filter((p) => p.position === position)
				.sort((a, b) => hash(`${seed}:${attempt}:${a.id}`) - hash(`${seed}:${attempt}:${b.id}`));
			let taken = 0;
			for (const p of eligible) {
				if (taken === formation[position]) break;
				if ((nationCount[p.nation] ?? 0) >= rules.maxPerNation) continue;
				if (spent + p.value > rules.budget) continue;
				picks.push(p);
				nationCount[p.nation] = (nationCount[p.nation] ?? 0) + 1;
				spent += p.value;
				taken++;
			}
			if (taken < formation[position]) {
				complete = false;
				break;
			}
		}
		if (complete && picks.length === rules.size) return picks;
	}
	throw new Error(`could not build a legal squad for ${seed}`);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (did you pass --env-file=.env?)');

const client = postgres(url);
const db = drizzle(client, { schema });
const excluded = (column: string) => sql.raw(`excluded.${column}`);

try {
	// Load the player pool. Our own connection doesn't parse numeric → number,
	// so coerce `value` explicitly. Keep both the nation code (to match matches)
	// and the nation name (for the squad rules / display).
	const rows = await db
		.select({
			id: schema.player.id,
			name: schema.player.name,
			code: schema.player.nationalTeamId,
			nation: schema.nationalTeam.name,
			position: schema.player.position,
			value: schema.player.value
		})
		.from(schema.player)
		.innerJoin(schema.nationalTeam, eq(schema.player.nationalTeamId, schema.nationalTeam.id));
	if (rows.length === 0) throw new Error('no players found — run `pnpm db:seed` first');

	const pool: Player[] = rows.map((r) => ({
		id: r.id,
		name: r.name,
		nation: r.nation,
		position: r.position,
		value: Number(r.value)
	}));

	const matches = await db
		.select({
			id: schema.match.id,
			homeTeamId: schema.match.homeTeamId,
			awayTeamId: schema.match.awayTeamId
		})
		.from(schema.match);

	// 1. Demo teams — each a randomized legal XI, locked.
	for (let i = 0; i < DEMO_TEAMS.length; i++) {
		const squad = pickSquad(pool, RULES, `demo-${i + 1}`);
		const [row] = await db
			.insert(schema.team)
			.values({
				userId: `demo-${i + 1}`,
				name: DEMO_TEAMS[i],
				status: 'locked',
				lockedAt: new Date()
			})
			.onConflictDoUpdate({
				target: schema.team.userId,
				set: { name: DEMO_TEAMS[i], status: 'locked' }
			})
			.returning({ id: schema.team.id });
		await db.delete(schema.teamSelection).where(eq(schema.teamSelection.teamId, row.id));
		await db
			.insert(schema.teamSelection)
			.values(squad.map((p) => ({ teamId: row.id, playerId: p.id })));
	}

	// 2. Fake events for every match, then mark those matches finished.
	const squads = new Map<string, SquadMember[]>();
	for (const r of rows) {
		const list = squads.get(r.code) ?? [];
		list.push({ id: r.id, position: r.position });
		squads.set(r.code, list);
	}
	const { stats, finishedMatchIds } = dummyEvents(matches, squads);

	await db
		.insert(schema.playerMatchStat)
		.values(stats)
		.onConflictDoUpdate({
			target: [schema.playerMatchStat.playerId, schema.playerMatchStat.matchId],
			set: {
				goals: excluded('goals'),
				assists: excluded('assists'),
				cleanSheet: excluded('clean_sheet'),
				yellows: excluded('yellows'),
				reds: excluded('reds'),
				motm: excluded('motm')
			}
		});
	await db
		.update(schema.match)
		.set({ status: 'finished' })
		.where(inArray(schema.match.id, finishedMatchIds));

	console.log(
		`Seeded ${DEMO_TEAMS.length} demo teams and ${stats.length} stat rows ` +
			`across ${finishedMatchIds.length} matches.`
	);
} finally {
	await client.end();
}
