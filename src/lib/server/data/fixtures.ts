import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { FeedTeam, FeedMatch } from './transform';

/**
 * Loads the saved football-data.org responses from ./fixtures. They are a
 * one-time snapshot (see each file's `source`/`fetchedAt`) so the seed and its
 * tests run offline, with no API token and no rate limit. Refresh by re-fetching
 * the two endpoints and overwriting the JSON.
 */

interface TeamsFixture {
	source: string;
	fetchedAt: string;
	count: number;
	teams: FeedTeam[];
}

interface MatchesFixture {
	source: string;
	fetchedAt: string;
	count: number;
	matches: FeedMatch[];
}

function readJson<T>(relativePath: string): T {
	const path = fileURLToPath(new URL(relativePath, import.meta.url));
	return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

export function loadTeams(): FeedTeam[] {
	return readJson<TeamsFixture>('./fixtures/teams.json').teams;
}

export function loadMatches(): FeedMatch[] {
	return readJson<MatchesFixture>('./fixtures/matches.json').matches;
}
