export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export const POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

export const POSITION_LABELS: Record<Position, string> = {
	GK: 'Goalkeeper',
	DEF: 'Defender',
	MID: 'Midfielder',
	FWD: 'Forward'
};

export interface Player {
	id: string;
	name: string;
	nation: string;
	position: Position;
	/** Value in millions, counted against the budget. */
	value: number;
}

export interface SquadRules {
	size: number;
	budget: number;
	maxPerNation: number;
	positions: Record<Position, { min: number; max: number }>;
}

/**
 * The authoritative squad rules. Mirrors docs/game-mechanics.md §6.1–6.2.
 * Keep these here so the UI and server validate against the same numbers.
 */
export const RULES: SquadRules = {
	size: 11,
	budget: 100,
	maxPerNation: 3,
	positions: {
		GK: { min: 1, max: 1 },
		DEF: { min: 3, max: 5 },
		MID: { min: 2, max: 5 },
		FWD: { min: 1, max: 3 }
	}
};
