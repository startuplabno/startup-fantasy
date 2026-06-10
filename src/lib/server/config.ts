import { eq } from 'drizzle-orm';
import { db } from './db';
import { config } from './db/schema';
import { RULES, type SquadRules } from '$lib/game/types';

export interface GameConfig {
	deadlineAt: Date;
	transfersEnabled: boolean;
	transfersPerGameweek: number;
}

const SINGLETON_ID = 1;

/**
 * Far-future default so an un-administered config behaves as "deadline open".
 * The real deadline is set explicitly (seed/admin); this only avoids a NULL on
 * first read, since the column is now NOT NULL.
 */
const DEFAULT_DEADLINE = new Date('2999-12-31T00:00:00Z');

/** The single config row, creating it with defaults on first read. */
export async function getConfig(): Promise<GameConfig> {
	const [row] = await db.select().from(config).where(eq(config.id, SINGLETON_ID));
	if (row) return row;

	const [created] = await db
		.insert(config)
		.values({ id: SINGLETON_ID, deadlineAt: DEFAULT_DEADLINE })
		.onConflictDoNothing()
		.returning();
	// A concurrent insert may have won the race; re-read to be safe.
	if (created) return created;
	const [existing] = await db.select().from(config).where(eq(config.id, SINGLETON_ID));
	return existing;
}

/**
 * Squad rules. Budget and ownership cap are deploy-time constants now (see
 * `$lib/game/types`), so the config row no longer overrides them. Kept as a
 * function so callers have a single source for the active ruleset.
 */
export function effectiveRules(): SquadRules {
	return RULES;
}

/** Whether the squad-lock deadline has passed. */
export function isPastDeadline(cfg: GameConfig, now: Date = new Date()): boolean {
	return now >= cfg.deadlineAt;
}
