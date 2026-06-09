import { describe, expect, it } from 'vitest';
import { isValid, randomize, summarize, validate } from './squad';
import { PLACEHOLDER_PLAYERS } from './players';
import { RULES, type Ownership, type Player } from './types';

function player(over: Partial<Player> & Pick<Player, 'position'>): Player {
	return {
		id: Math.random().toString(36).slice(2),
		name: 'Test Player',
		nation: 'Testland',
		value: 5,
		...over
	};
}

/** A legal 1-4-4-2 XI spread across four nations, well under budget. */
function legalSquad(): Player[] {
	const nations = ['A', 'B', 'C', 'D'];
	let n = 0;
	const make = (position: Player['position'], count: number) =>
		Array.from({ length: count }, () =>
			player({ position, nation: nations[n++ % nations.length], value: 5 })
		);
	return [...make('GK', 1), ...make('DEF', 4), ...make('MID', 4), ...make('FWD', 2)];
}

describe('validate', () => {
	it('accepts a legal squad', () => {
		expect(validate(legalSquad(), RULES)).toEqual([]);
		expect(isValid(legalSquad(), RULES)).toBe(true);
	});

	it('rejects the wrong number of players', () => {
		expect(isValid(legalSquad().slice(0, 10), RULES)).toBe(false);
	});

	it('rejects breaking a positional range', () => {
		const squad = legalSquad();
		squad[0] = player({ position: 'FWD', nation: 'E' }); // no goalkeeper
		expect(isValid(squad, RULES)).toBe(false);
	});

	it('rejects more than three from one nation', () => {
		const squad = legalSquad();
		for (let i = 1; i <= 4; i++) squad[i] = player({ position: 'DEF', nation: 'SameLand' });
		expect(isValid(squad, RULES)).toBe(false);
	});

	it('rejects going over budget', () => {
		const squad = legalSquad().map((p) => ({ ...p, value: 20 }));
		expect(isValid(squad, RULES)).toBe(false);
	});

	it('rejects a player at the ownership cap', () => {
		const squad = legalSquad();
		const ownership: Ownership = { counts: { [squad[5].id]: 2 }, cap: 2 };
		const issues = validate(squad, RULES, ownership);
		expect(issues.some((i) => i.message.includes('ownership cap'))).toBe(true);
	});

	it('ignores ownership below the cap', () => {
		const squad = legalSquad();
		const ownership: Ownership = { counts: { [squad[5].id]: 1 }, cap: 2 };
		expect(isValid(squad, RULES, ownership)).toBe(true);
	});
});

describe('summarize', () => {
	it('totals spend and counts', () => {
		const s = summarize(legalSquad(), RULES.budget);
		expect(s.count).toBe(11);
		expect(s.spent).toBe(55);
		expect(s.remaining).toBe(45);
		expect(s.byPosition).toEqual({ GK: 1, DEF: 4, MID: 4, FWD: 2 });
	});
});

describe('randomize', () => {
	it('produces a valid squad from the player pool', () => {
		expect(isValid(randomize(PLACEHOLDER_PLAYERS, RULES), RULES)).toBe(true);
	});
});
