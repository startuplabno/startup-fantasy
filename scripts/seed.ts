import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as schema from '../src/lib/server/db/schema';
import { loadMatches, loadTeams } from '../src/lib/server/data/fixtures';
import { toMatches, toNationalTeams, toPlayers } from '../src/lib/server/data/transform';

/**
 * Fills national_team, player and match from the saved World Cup feed
 * (src/lib/server/data/fixtures). Run with `pnpm db:seed` after `pnpm db:push`.
 *
 * Idempotent: re-running upserts by primary key, so it refreshes names/prices
 * without creating duplicates. It deliberately does not touch national_team
 * status, so a nation marked eliminated stays eliminated across a re-seed.
 *
 * player_match_stat is left empty on purpose — the free data plan does not
 * expose per-match player events, so match scoring is out of scope here.
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (did you pass --env-file=.env?)');

const client = postgres(url);
const db = drizzle(client, { schema });

/** Overwrite a column with the value the conflicting row tried to insert. */
const excluded = (column: string) => sql.raw(`excluded.${column}`);

try {
	const teams = loadTeams();
	const matches = loadMatches();

	const nations = toNationalTeams(teams);
	const players = toPlayers(teams);
	const fixtures = toMatches(matches);

	await db
		.insert(schema.nationalTeam)
		.values(nations)
		.onConflictDoUpdate({ target: schema.nationalTeam.id, set: { name: excluded('name') } });

	await db
		.insert(schema.player)
		.values(players)
		.onConflictDoUpdate({
			target: schema.player.id,
			set: {
				name: excluded('name'),
				nationalTeamId: excluded('national_team_id'),
				position: excluded('position'),
				value: excluded('value')
			}
		});

	await db
		.insert(schema.match)
		.values(fixtures)
		.onConflictDoUpdate({
			target: schema.match.id,
			set: {
				homeTeamId: excluded('home_team_id'),
				awayTeamId: excluded('away_team_id'),
				kickoffAt: excluded('kickoff_at'),
				status: excluded('status'),
				gameweek: excluded('gameweek')
			}
		});

	console.log(
		`Seeded ${nations.length} nations, ${players.length} players, ${fixtures.length} matches ` +
			`(${matches.length - fixtures.length} knockout matches skipped — teams not drawn yet).`
	);
} finally {
	await client.end();
}
