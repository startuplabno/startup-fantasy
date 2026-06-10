import { eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { player, nationalTeam } from './db/schema';
import type { Player } from '$lib/game/types';

// The game speaks in nation names ("Uruguay"); the player table stores the
// ISO-3 code, so every read joins national_team to resolve it. Selecting these
// exact columns makes each row a game `Player` with no extra mapping.
const playerColumns = {
	id: player.id,
	name: player.name,
	nation: nationalTeam.name,
	position: player.position,
	value: player.value
};

/** Every drafted player, for the draft board. */
export async function listPlayers(): Promise<Player[]> {
	return db
		.select(playerColumns)
		.from(player)
		.innerJoin(nationalTeam, eq(player.nationalTeamId, nationalTeam.id))
		.orderBy(player.name);
}

/** Resolve a set of ids to players; unknown ids are simply absent. */
export async function getPlayersByIds(ids: string[]): Promise<Player[]> {
	if (ids.length === 0) return [];
	return db
		.select(playerColumns)
		.from(player)
		.innerJoin(nationalTeam, eq(player.nationalTeamId, nationalTeam.id))
		.where(inArray(player.id, ids));
}
