import { sql, eq, and, ne } from 'drizzle-orm';
import { db } from './db';
import { team, teamSelection } from './db/schema';
import { OWNERSHIP_CAP_PCT, type Ownership } from '$lib/game/types';

/**
 * How many locked teams own each player, plus the derived cap. Ownership is
 * counted across *other* users' locked teams (the current user's own picks
 * don't count against themselves). A cap percentage of 100 disables the rule.
 */
export async function getOwnership(excludeUserId: string): Promise<Ownership> {
	const rows = await db
		.select({ playerId: teamSelection.playerId, count: sql<number>`count(*)::int` })
		.from(teamSelection)
		.innerJoin(team, eq(teamSelection.teamId, team.id))
		.where(and(eq(team.status, 'locked'), ne(team.userId, excludeUserId)))
		.groupBy(teamSelection.playerId);

	const counts: Record<string, number> = {};
	for (const r of rows) counts[r.playerId] = r.count;

	const [{ lockedTeams }] = await db
		.select({ lockedTeams: sql<number>`count(*)::int` })
		.from(team)
		.where(and(eq(team.status, 'locked'), ne(team.userId, excludeUserId)));

	const cap =
		OWNERSHIP_CAP_PCT >= 100
			? Number.POSITIVE_INFINITY
			: Math.max(1, Math.floor((OWNERSHIP_CAP_PCT / 100) * lockedTeams));

	return { counts, cap };
}
