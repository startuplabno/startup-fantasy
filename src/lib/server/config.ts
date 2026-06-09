import { eq } from 'drizzle-orm';
import { db } from './db';
import { config } from './db/schema';
import { RULES, type SquadRules } from '$lib/game/types';

export interface GameConfig {
	budgetCap: number;
	ownershipCapPct: number;
	deadlineAt: Date | null;
	transfersEnabled: boolean;
	transfersPerGameweek: number;
}

const SINGLETON_ID = 1;

/** The single config row, creating it with defaults on first read. */
export async function getConfig(): Promise<GameConfig> {
	const [row] = await db.select().from(config).where(eq(config.id, SINGLETON_ID));
	if (row) return row;

	const [created] = await db
		.insert(config)
		.values({ id: SINGLETON_ID })
		.onConflictDoNothing()
		.returning();
	// A concurrent insert may have won the race; re-read to be safe.
	if (created) return created;
	const [existing] = await db.select().from(config).where(eq(config.id, SINGLETON_ID));
	return existing;
}

/** Squad rules with the runtime-tunable budget applied over the static defaults. */
export function effectiveRules(cfg: GameConfig): SquadRules {
	return { ...RULES, budget: cfg.budgetCap };
}

/** Whether the squad-lock deadline has passed. No deadline set means always open. */
export function isPastDeadline(cfg: GameConfig, now: Date = new Date()): boolean {
	return cfg.deadlineAt !== null && now >= cfg.deadlineAt;
}
