import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	boolean,
	primaryKey
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

/**
 * Single-row tunables (PRD §8). Values that must change without a deploy live
 * here, not hardcoded. Enforced as one row via `id` defaulting to 1.
 */
export const config = pgTable('config', {
	id: integer('id').primaryKey().default(1),
	budgetCap: integer('budget_cap').notNull().default(100),
	ownershipCapPct: integer('ownership_cap_pct').notNull().default(100),
	deadlineAt: timestamp('deadline_at'),
	transfersEnabled: boolean('transfers_enabled').notNull().default(false),
	transfersPerGameweek: integer('transfers_per_gameweek').notNull().default(2)
});

export const nationalTeam = pgTable('national_team', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	status: text('status', { enum: ['in', 'eliminated'] })
		.notNull()
		.default('in')
});

export const player = pgTable('player', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	nationId: text('nation_id')
		.notNull()
		.references(() => nationalTeam.id),
	position: text('position', { enum: ['GK', 'DEF', 'MID', 'FWD'] }).notNull(),
	// Value in millions, counted against the budget.
	value: integer('value').notNull()
});

export const match = pgTable('match', {
	id: text('id').primaryKey(),
	homeTeamId: text('home_team_id')
		.notNull()
		.references(() => nationalTeam.id),
	awayTeamId: text('away_team_id')
		.notNull()
		.references(() => nationalTeam.id),
	kickoffAt: timestamp('kickoff_at').notNull(),
	status: text('status', { enum: ['scheduled', 'finished'] })
		.notNull()
		.default('scheduled'),
	gameweek: integer('gameweek').notNull()
});

export const team = pgTable('team', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	status: text('status', { enum: ['draft', 'locked'] })
		.notNull()
		.default('draft'),
	lockedAt: timestamp('locked_at'),
	// Cached sum of player points. Written by the Novem scoring job; read here.
	totalPoints: integer('total_points').notNull().default(0)
});

export const teamSelection = pgTable('team_selection', {
	id: serial('id').primaryKey(),
	teamId: integer('team_id')
		.notNull()
		.references(() => team.id, { onDelete: 'cascade' }),
	playerId: text('player_id')
		.notNull()
		.references(() => player.id),
	// Player value at the moment of selection, so later price changes don't
	// retroactively break a locked squad's budget.
	purchaseValue: integer('purchase_value').notNull()
});

/**
 * Raw per-player-per-match facts from the data feed. Written by the Novem
 * ingest job. Kept separate from computed points so scoring stays recomputable.
 */
export const playerMatchStat = pgTable(
	'player_match_stat',
	{
		playerId: text('player_id')
			.notNull()
			.references(() => player.id),
		matchId: text('match_id')
			.notNull()
			.references(() => match.id),
		goals: integer('goals').notNull().default(0),
		assists: integer('assists').notNull().default(0),
		cleanSheet: boolean('clean_sheet').notNull().default(false),
		yellows: integer('yellows').notNull().default(0),
		reds: integer('reds').notNull().default(0),
		motm: boolean('motm').notNull().default(false)
	},
	(t) => [primaryKey({ columns: [t.playerId, t.matchId] })]
);

/** Points derived from PlayerMatchStat × scoring table. Written by Novem. */
export const playerMatchScore = pgTable(
	'player_match_score',
	{
		playerId: text('player_id')
			.notNull()
			.references(() => player.id),
		matchId: text('match_id')
			.notNull()
			.references(() => match.id),
		points: integer('points').notNull().default(0)
	},
	(t) => [primaryKey({ columns: [t.playerId, t.matchId] })]
);

export * from './auth.schema';
