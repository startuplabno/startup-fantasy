import { inArray, eq } from 'drizzle-orm';
import { db } from './db';
import { player, nationalTeam } from './db/schema';
import type { Player } from '$lib/game/types';

const selection = {
	id: player.id,
	name: player.name,
	nation: nationalTeam.name,
	position: player.position,
	value: player.value
};

// drizzle's `numeric` column returns the value as a string at runtime, even
// though `$type<number>()` makes the type system believe it's a number. Coerce
// it for real here so the squad math (budget sums, comparisons) doesn't
// string-concat and silently break.
const toPlayer = (row: Player): Player => ({ ...row, value: Number(row.value) });

/** The full draftable player pool, with nation names resolved for display. */
export async function getAllPlayers(): Promise<Player[]> {
	const rows = await db
		.select(selection)
		.from(player)
		.innerJoin(nationalTeam, eq(player.nationalTeamId, nationalTeam.id))
		.orderBy(player.position, player.name);
	return rows.map(toPlayer);
}

/** Resolve a list of ids to players, dropping any unknown ids. */
export async function getPlayersByIds(ids: string[]): Promise<Player[]> {
	if (ids.length === 0) return [];
	const rows = await db
		.select(selection)
		.from(player)
		.innerJoin(nationalTeam, eq(player.nationalTeamId, nationalTeam.id))
		.where(inArray(player.id, ids));
	return rows.map(toPlayer);
}
