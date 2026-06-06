import { eq } from 'drizzle-orm';
import { db } from './db';
import { team, teamSelection } from './db/schema';

export interface StoredTeam {
	id: number;
	name: string;
	status: 'draft' | 'locked';
	lockedAt: Date | null;
	playerIds: string[];
}

/** The user's team and its selected player ids, or null if they have none yet. */
export async function getTeam(userId: string): Promise<StoredTeam | null> {
	const [row] = await db.select().from(team).where(eq(team.userId, userId));
	if (!row) return null;

	const selections = await db
		.select({ playerId: teamSelection.playerId })
		.from(teamSelection)
		.where(eq(teamSelection.teamId, row.id));

	return {
		id: row.id,
		name: row.name,
		status: row.status,
		lockedAt: row.lockedAt,
		playerIds: selections.map((s) => s.playerId)
	};
}

/**
 * Persist the user's XI as a locked team. Upserts the team row (one per user)
 * and replaces its selections. Callers must validate the squad first — this
 * function only writes.
 */
export async function lockTeam(userId: string, name: string, playerIds: string[]): Promise<void> {
	const [row] = await db
		.insert(team)
		.values({ userId, name, status: 'locked', lockedAt: new Date() })
		.onConflictDoUpdate({
			target: team.userId,
			set: { name, status: 'locked', lockedAt: new Date() }
		})
		.returning({ id: team.id });

	await db.delete(teamSelection).where(eq(teamSelection.teamId, row.id));
	if (playerIds.length > 0) {
		await db
			.insert(teamSelection)
			.values(playerIds.map((playerId) => ({ teamId: row.id, playerId })));
	}
}
