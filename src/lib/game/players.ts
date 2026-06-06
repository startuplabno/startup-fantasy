import type { Player } from './types';

/**
 * PLACEHOLDER player pool. Fictional names and made-up values so the draft
 * board renders before the real World Cup data feed lands. The feed will
 * populate these from the database (see docs/architecture.md "Data model").
 */
export const PLAYERS: Player[] = [
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

const byId = new Map(PLAYERS.map((p) => [p.id, p]));

export function getPlayer(id: string): Player | undefined {
	return byId.get(id);
}

/** Resolve a list of ids to players, dropping any unknown ids. */
export function getPlayers(ids: string[]): Player[] {
	return ids.map((id) => byId.get(id)).filter((p): p is Player => p !== undefined);
}
