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

/** The full draftable player pool, with nation names resolved for display. */
export async function getAllPlayers(): Promise<Player[]> {
	return db
		.select(selection)
		.from(player)
		.innerJoin(nationalTeam, eq(player.nationId, nationalTeam.id))
		.orderBy(player.position, player.name);
}

/** Resolve a list of ids to players, dropping any unknown ids. */
export async function getPlayersByIds(ids: string[]): Promise<Player[]> {
	if (ids.length === 0) return [];
	return db
		.select(selection)
		.from(player)
		.innerJoin(nationalTeam, eq(player.nationId, nationalTeam.id))
		.where(inArray(player.id, ids));
}
