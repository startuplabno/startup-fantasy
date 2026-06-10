import { describe, expect, it } from 'vitest';
import { gameweekFor, priceFor, toMatches, toNationalTeams, toPlayers } from './transform';
import { loadMatches, loadTeams } from './fixtures';
import { isValid, randomize } from '../../game/squad';
import { POSITIONS, RULES, type Player, type Position } from '../../game/types';

// The fixtures are the real football-data.org snapshot, so these tests double as
// the answer to "do we have enough data to fill the tables?" — if the feed ever
// changes shape or loses coverage, they fail.
const teams = loadTeams();
const matches = loadMatches();

describe('priceFor', () => {
	it('is deterministic for a given player', () => {
		expect(priceFor('MID', 'player-123')).toBe(priceFor('MID', 'player-123'));
	});

	it('stays within the band for its position', () => {
		// Base 4/5/6/7 by position, plus 0..5.0 on top.
		const bands: Record<Position, [number, number]> = {
			GK: [4, 9],
			DEF: [5, 10],
			MID: [6, 11],
			FWD: [7, 12]
		};
		for (const position of POSITIONS) {
			const [min, max] = bands[position];
			for (const id of ['a', 'b', 'c', '999', 'xyz', '']) {
				const value = priceFor(position, id);
				expect(value).toBeGreaterThanOrEqual(min);
				expect(value).toBeLessThanOrEqual(max);
			}
		}
	});

	it('produces values on a single decimal place', () => {
		// Every price is a multiple of 0.5, so it fits numeric(5,1) exactly.
		expect((priceFor('FWD', 'someone') * 2) % 1).toBe(0);
	});
});

describe('gameweekFor', () => {
	it('maps group matchdays to gameweeks 1-3', () => {
		expect(gameweekFor('GROUP_STAGE', 1)).toBe(1);
		expect(gameweekFor('GROUP_STAGE', 3)).toBe(3);
	});

	it('maps knockout rounds to later gameweeks', () => {
		expect(gameweekFor('LAST_32', 1)).toBe(4);
		expect(gameweekFor('FINAL', 1)).toBe(8);
		expect(gameweekFor('THIRD_PLACE', 1)).toBe(8);
	});

	it('handles knockout matches with no matchday in the feed', () => {
		expect(gameweekFor('LAST_32', null)).toBe(4);
	});

	it('rejects an unknown stage', () => {
		expect(() => gameweekFor('FRIENDLY', 1)).toThrow();
	});

	it('rejects an out-of-range group matchday', () => {
		expect(() => gameweekFor('GROUP_STAGE', 4)).toThrow();
	});
});

describe('toNationalTeams (real fixture)', () => {
	const nations = toNationalTeams(teams);

	it('produces one row per World Cup nation', () => {
		expect(nations).toHaveLength(48);
	});

	it('keys every nation by a unique ISO-3 code', () => {
		const ids = nations.map((n) => n.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id).toMatch(/^[A-Z]{3}$/);
	});
});

describe('toPlayers (real fixture)', () => {
	const players = toPlayers(teams);
	const nationIds = new Set(toNationalTeams(teams).map((n) => n.id));

	it('keeps only real players in the four positions', () => {
		expect(players.length).toBeGreaterThan(1000);
		for (const p of players) expect(POSITIONS).toContain(p.position);
	});

	it('ties every player to a seeded nation', () => {
		for (const p of players) expect(nationIds.has(p.nationalTeamId)).toBe(true);
	});

	it('prices every player inside the global band', () => {
		for (const p of players) {
			expect(p.value).toBeGreaterThanOrEqual(4);
			expect(p.value).toBeLessThanOrEqual(12);
		}
	});

	it('has enough players in every position to fill a squad', () => {
		for (const position of POSITIONS) {
			const count = players.filter((p) => p.position === position).length;
			expect(count).toBeGreaterThanOrEqual(RULES.positions[position].max);
		}
	});
});

describe('toMatches (real fixture)', () => {
	const seeded = toMatches(matches);
	const nationIds = new Set(toNationalTeams(teams).map((n) => n.id));

	it('seeds only matches whose teams are drawn (the 72 group games today)', () => {
		expect(seeded).toHaveLength(72);
	});

	it('references only seeded nations and real kickoff times', () => {
		for (const m of seeded) {
			expect(nationIds.has(m.homeTeamId)).toBe(true);
			expect(nationIds.has(m.awayTeamId)).toBe(true);
			expect(Number.isNaN(m.kickoffAt.getTime())).toBe(false);
		}
	});

	it('places every seeded match in a group-stage gameweek', () => {
		for (const m of seeded) {
			expect(m.gameweek).toBeGreaterThanOrEqual(1);
			expect(m.gameweek).toBeLessThanOrEqual(3);
		}
	});
});

describe('seeded pool plays by the game rules', () => {
	// The whole point of the data: you can actually build a legal team from it.
	const pool: Player[] = toPlayers(teams).map((p) => ({
		id: p.id,
		name: p.name,
		nation: p.nationalTeamId,
		position: p.position,
		value: p.value
	}));

	it('can produce a valid randomized XI', () => {
		// randomize() is best-effort: it can return an invalid attempt if it
		// doesn't hit a legal squad within its retry budget. A few tries keeps
		// the test from flaking while still proving the pool can make a legal XI.
		let valid = false;
		for (let attempt = 0; attempt < 5 && !valid; attempt++) {
			valid = isValid(randomize(pool));
		}
		expect(valid).toBe(true);
	});
});
