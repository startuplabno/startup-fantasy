import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config, nationalTeam, player } from './schema';
import { PLACEHOLDER_PLAYERS } from '../../game/players';

/**
 * Seeds the database with the single config row, the national teams, and the
 * placeholder player pool. Idempotent: safe to run repeatedly. Runs outside
 * Vite (via `pnpm db:seed`), so it builds its own connection from DATABASE_URL
 * rather than using the `$env`-based client.
 */
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = postgres(url);
const db = drizzle(client, { schema });

function slug(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-');
}

async function main() {
	// deadlineAt is NOT NULL; seed a far-future placeholder so it reads as "open"
	// until an admin sets the real deadline.
	await db
		.insert(config)
		.values({ id: 1, deadlineAt: new Date('2999-12-31T00:00:00Z') })
		.onConflictDoNothing();

	const nations = [...new Set(PLACEHOLDER_PLAYERS.map((p) => p.nation))];
	await db
		.insert(nationalTeam)
		.values(nations.map((name) => ({ id: slug(name), name })))
		.onConflictDoNothing();

	for (const p of PLACEHOLDER_PLAYERS) {
		const row = {
			id: p.id,
			name: p.name,
			nationalTeamId: slug(p.nation),
			position: p.position,
			value: p.value
		};
		await db
			.insert(player)
			.values(row)
			.onConflictDoUpdate({
				target: player.id,
				set: {
					name: row.name,
					nationalTeamId: row.nationalTeamId,
					position: row.position,
					value: row.value
				}
			});
	}

	console.log(`Seeded ${nations.length} nations and ${PLACEHOLDER_PLAYERS.length} players.`);
	await client.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
