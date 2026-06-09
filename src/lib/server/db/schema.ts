import { sql } from 'drizzle-orm';
import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	boolean,
	numeric,
	primaryKey,
	uniqueIndex
} from 'drizzle-orm/pg-core';

export const team = pgTable('team', {
	id: serial('id').primaryKey(),
	// Better Auth user id. Kept as plain text until `pnpm auth:schema` generates
	// the user table, at which point this can become a real foreign key.
	userId: text('user_id').notNull().unique(),
	name: text('name').notNull(),
	status: text('status', { enum: ['draft', 'locked'] })
		.notNull()
		.default('draft'),
	lockedAt: timestamp('locked_at')
});

export const nationalTeam = pgTable('national_team', {
	// ISO-3 country code from the feed (e.g. 'NOR', 'BRA').
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	status: text('status', { enum: ['in', 'eliminated'] })
		.notNull()
		.default('in')
});

export const player = pgTable('player', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	nationalTeamId: text('national_team_id')
		.notNull()
		.references(() => nationalTeam.id),
	position: text('position', { enum: ['GK', 'DEF', 'MID', 'FWD'] }).notNull(),
	// Millions, one decimal place. The postgres-js client parses numeric → number
	// (see src/lib/server/db/index.ts); $type<number>() lines up the TS type.
	value: numeric('value', { precision: 5, scale: 1 }).$type<number>().notNull()
});

export const teamSelection = pgTable(
	'team_selection',
	{
		id: serial('id').primaryKey(),
		teamId: integer('team_id')
			.notNull()
			.references(() => team.id, { onDelete: 'cascade' }),
		playerId: text('player_id')
			.notNull()
			.references(() => player.id),
		// NULL = open-ended. activeFrom = NULL means "since lock"; activeTo = NULL
		// means "still active". Filled in only when transfers move a player in/out.
		activeFrom: timestamp('active_from'),
		activeTo: timestamp('active_to')
	},
	(t) => [
		// Partial: at most one *currently-active* row per (team, player). A transferred-out
		// row keeps its history with activeTo set, so a later re-pick is allowed.
		uniqueIndex('team_selection_active_key')
			.on(t.teamId, t.playerId)
			.where(sql`${t.activeTo} IS NULL`)
	]
);

export const match = pgTable('match', {
	id: text('id').primaryKey(),
	homeTeamId: text('home_team_id')
		.notNull()
		.references(() => nationalTeam.id),
	awayTeamId: text('away_team_id')
		.notNull()
		.references(() => nationalTeam.id),
	kickoffAt: timestamp('kickoff_at').notNull(),
	status: text('status', { enum: ['scheduled', 'live', 'finished'] })
		.notNull()
		.default('scheduled'),
	gameweek: integer('gameweek').notNull()
});

// Raw per-player-per-match facts from the data feed. Kept separate from
// player_match_score so points can be recomputed from these (no admin UI;
// see docs/architecture.md "Data model" and PRD §8).
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

// Derived points = stats × scoring table. Owned by the Novem runner;
// re-running on the same stats must produce the same row (idempotent).
export const playerMatchScore = pgTable(
	'player_match_score',
	{
		playerId: text('player_id')
			.notNull()
			.references(() => player.id),
		matchId: text('match_id')
			.notNull()
			.references(() => match.id),
		points: integer('points').notNull()
	},
	(t) => [primaryKey({ columns: [t.playerId, t.matchId] })]
);

// Singleton row (id=1). Squad rules (budget, ownership, positions) live in
// `src/lib/game/types.ts` since they shouldn't change without a deploy.
export const config = pgTable('config', {
	id: serial('id').primaryKey(),
	deadlineAt: timestamp('deadline_at').notNull(),
	transfersEnabled: boolean('transfers_enabled').notNull().default(false),
	transfersPerGameweek: integer('transfers_per_gameweek').notNull().default(2)
});

export * from './auth.schema';
