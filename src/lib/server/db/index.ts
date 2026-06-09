import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Parse Postgres numeric (OID 1700) as JS number. Default postgres.js behavior
// returns it as string to preserve arbitrary precision; our values fit easily
// in IEEE-754 and we want math, not string concat.
const client = postgres(env.DATABASE_URL, {
	types: {
		numeric: {
			to: 1700,
			from: [1700],
			serialize: (x: number | string) => (typeof x === 'string' ? x : x.toString()),
			parse: (x: string) => Number(x)
		}
	}
});

export const db = drizzle(client, { schema });
