import type { Player } from './types';

/**
 * URL of a player's headshot on the API-Football CDN. Our player ids are
 * API-Football ids, so the photo URL is fully derivable — no API call or DB
 * column needed. Not every id has an image, so callers must handle 404s (see
 * `PlayerAvatar.svelte`).
 */
export function playerPhotoUrl(id: string): string {
	return `https://media.api-sports.io/football/players/${id}.png`;
}

// Nation name/id -> ISO 3166 flag code (gb-eng etc. for the UK home nations).
// Keys are the nation name lowercased with all non-letter characters stripped,
// matching the normalization in nationFlagUrl below.
const NATION_CODES: Record<string, string> = {
	// Qatar 2022 World Cup nations
	qatar: 'qa',
	ecuador: 'ec',
	senegal: 'sn',
	netherlands: 'nl',
	england: 'gb-eng',
	iran: 'ir',
	usa: 'us',
	unitedstates: 'us',
	wales: 'gb-wls',
	scotland: 'gb-sct',
	argentina: 'ar',
	saudiarabia: 'sa',
	mexico: 'mx',
	poland: 'pl',
	france: 'fr',
	australia: 'au',
	denmark: 'dk',
	tunisia: 'tn',
	spain: 'es',
	costarica: 'cr',
	germany: 'de',
	japan: 'jp',
	belgium: 'be',
	canada: 'ca',
	morocco: 'ma',
	croatia: 'hr',
	brazil: 'br',
	serbia: 'rs',
	switzerland: 'ch',
	cameroon: 'cm',
	portugal: 'pt',
	ghana: 'gh',
	uruguay: 'uy',
	southkorea: 'kr',
	korearepublic: 'kr',
	norway: 'no',
	sweden: 'se',
	// 2026 World Cup additions (48-team format)
	paraguay: 'py',
	southafrica: 'za',
	algeria: 'dz',
	newzealand: 'nz',
	czechia: 'cz',
	turkey: 'tr',
	austria: 'at',
	colombia: 'co',
	egypt: 'eg',
	haiti: 'ht',
	bosniaherzegovina: 'ba',
	panama: 'pa',
	capeverdeislands: 'cv',
	congodr: 'cd',
	ivorycoast: 'ci',
	jordan: 'jo',
	iraq: 'iq',
	uzbekistan: 'uz',
	// "Curaçao" — ç is stripped by the normalizer, key becomes "curaao"
	curaao: 'cw'
};

/** Flag image URL for a nation name/id, or `null` if we have no mapping. */
export function nationFlagUrl(nation: string): string | null {
	const code = NATION_CODES[nation.toLowerCase().replace(/[^a-z]/g, '')];
	return code ? `https://flagcdn.com/h20/${code}.png` : null;
}

/**
 * PLACEHOLDER player pool. Fictional names and made-up values, used to seed the
 * database (see `src/lib/server/db/seed.ts`) and as a fixture in tests. The real
 * pool is read from the database at runtime via `src/lib/server/players.ts`; the
 * World Cup data feed will eventually populate it (see docs/architecture.md).
 */
export const PLACEHOLDER_PLAYERS: Player[] = [
	// Norway
	{ id: 'no-gk', name: 'Ola Hansen', nation: 'Norway', position: 'GK', value: 5 },
	{ id: 'no-def1', name: 'Erik Berg', nation: 'Norway', position: 'DEF', value: 6 },
	{ id: 'no-def2', name: 'Lars Dahl', nation: 'Norway', position: 'DEF', value: 5 },
	{ id: 'no-mid1', name: 'Magnus Lie', nation: 'Norway', position: 'MID', value: 9 },
	{ id: 'no-mid2', name: 'Jonas Strand', nation: 'Norway', position: 'MID', value: 7 },
	{ id: 'no-fwd', name: 'Henrik Moe', nation: 'Norway', position: 'FWD', value: 12 },

	// Brazil
	{ id: 'br-gk', name: 'Caio Silva', nation: 'Brazil', position: 'GK', value: 6 },
	{ id: 'br-def1', name: 'Bruno Costa', nation: 'Brazil', position: 'DEF', value: 7 },
	{ id: 'br-def2', name: 'Diego Rocha', nation: 'Brazil', position: 'DEF', value: 6 },
	{ id: 'br-mid1', name: 'Lucas Pereira', nation: 'Brazil', position: 'MID', value: 10 },
	{ id: 'br-mid2', name: 'Rafael Lima', nation: 'Brazil', position: 'MID', value: 8 },
	{ id: 'br-fwd', name: 'Gabriel Souza', nation: 'Brazil', position: 'FWD', value: 13 },

	// France
	{ id: 'fr-gk', name: 'Hugo Martin', nation: 'France', position: 'GK', value: 6 },
	{ id: 'fr-def1', name: 'Antoine Robert', nation: 'France', position: 'DEF', value: 7 },
	{ id: 'fr-def2', name: 'Paul Girard', nation: 'France', position: 'DEF', value: 6 },
	{ id: 'fr-mid1', name: 'Théo Moreau', nation: 'France', position: 'MID', value: 9 },
	{ id: 'fr-mid2', name: 'Louis Faure', nation: 'France', position: 'MID', value: 8 },
	{ id: 'fr-fwd', name: 'Nathan Roux', nation: 'France', position: 'FWD', value: 12 },

	// Argentina
	{ id: 'ar-gk', name: 'Mateo Gómez', nation: 'Argentina', position: 'GK', value: 5 },
	{ id: 'ar-def1', name: 'Santiago Díaz', nation: 'Argentina', position: 'DEF', value: 6 },
	{ id: 'ar-def2', name: 'Tomás Fernández', nation: 'Argentina', position: 'DEF', value: 6 },
	{ id: 'ar-mid1', name: 'Joaquín Romero', nation: 'Argentina', position: 'MID', value: 10 },
	{ id: 'ar-mid2', name: 'Benjamín Torres', nation: 'Argentina', position: 'MID', value: 7 },
	{ id: 'ar-fwd', name: 'Lautaro Ruiz', nation: 'Argentina', position: 'FWD', value: 13 },

	// England
	{ id: 'en-gk', name: 'Jack Wright', nation: 'England', position: 'GK', value: 6 },
	{ id: 'en-def1', name: 'Harry Clarke', nation: 'England', position: 'DEF', value: 7 },
	{ id: 'en-def2', name: 'George Hughes', nation: 'England', position: 'DEF', value: 5 },
	{ id: 'en-mid1', name: 'Oliver Bennett', nation: 'England', position: 'MID', value: 9 },
	{ id: 'en-mid2', name: 'Charlie Ward', nation: 'England', position: 'MID', value: 8 },
	{ id: 'en-fwd', name: 'Alfie Turner', nation: 'England', position: 'FWD', value: 11 },

	// Spain
	{ id: 'es-gk', name: 'Pablo Navarro', nation: 'Spain', position: 'GK', value: 5 },
	{ id: 'es-def1', name: 'Sergio Molina', nation: 'Spain', position: 'DEF', value: 6 },
	{ id: 'es-def2', name: 'Álvaro Ortega', nation: 'Spain', position: 'DEF', value: 6 },
	{ id: 'es-mid1', name: 'Marco Iglesias', nation: 'Spain', position: 'MID', value: 11 },
	{ id: 'es-mid2', name: 'Daniel Castro', nation: 'Spain', position: 'MID', value: 8 },
	{ id: 'es-fwd', name: 'Hugo Vega', nation: 'Spain', position: 'FWD', value: 12 },

	// Germany
	{ id: 'de-gk', name: 'Leon Wagner', nation: 'Germany', position: 'GK', value: 6 },
	{ id: 'de-def1', name: 'Felix Becker', nation: 'Germany', position: 'DEF', value: 7 },
	{ id: 'de-def2', name: 'Jonas Schulz', nation: 'Germany', position: 'DEF', value: 5 },
	{ id: 'de-mid1', name: 'Niklas Hoffmann', nation: 'Germany', position: 'MID', value: 9 },
	{ id: 'de-mid2', name: 'Tim Krüger', nation: 'Germany', position: 'MID', value: 7 },
	{ id: 'de-fwd', name: 'Max Richter', nation: 'Germany', position: 'FWD', value: 11 },

	// Portugal
	{ id: 'pt-gk', name: 'João Sousa', nation: 'Portugal', position: 'GK', value: 5 },
	{ id: 'pt-def1', name: 'Tiago Cardoso', nation: 'Portugal', position: 'DEF', value: 6 },
	{ id: 'pt-def2', name: 'Rúben Fonseca', nation: 'Portugal', position: 'DEF', value: 6 },
	{ id: 'pt-mid1', name: 'André Pinto', nation: 'Portugal', position: 'MID', value: 10 },
	{ id: 'pt-mid2', name: 'Diogo Carvalho', nation: 'Portugal', position: 'MID', value: 8 },
	{ id: 'pt-fwd', name: 'Francisco Lopes', nation: 'Portugal', position: 'FWD', value: 12 }
];
