import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';

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

export const teamSelection = pgTable('team_selection', {
	id: serial('id').primaryKey(),
	teamId: integer('team_id')
		.notNull()
		.references(() => team.id, { onDelete: 'cascade' }),
	playerId: text('player_id').notNull()
});

export * from './auth.schema';
