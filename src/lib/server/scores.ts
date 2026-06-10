import { inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { playerMatchScore } from './db/schema';

/**
 * Total points per player, summed across all matches. Reads the Novem-written
 * `player_match_score` table; players with no settled matches simply return 0.
 */
export async function getPlayerPoints(playerIds: string[]): Promise<Record<string, number>> {
	const points: Record<string, number> = {};
	for (const id of playerIds) points[id] = 0;
	if (playerIds.length === 0) return points;

	const rows = await db
		.select({
			playerId: playerMatchScore.playerId,
			points: sql<number>`coalesce(sum(${playerMatchScore.points}), 0)::int`
		})
		.from(playerMatchScore)
		.where(inArray(playerMatchScore.playerId, playerIds))
		.groupBy(playerMatchScore.playerId);

	for (const r of rows) points[r.playerId] = r.points;
	return points;
}
