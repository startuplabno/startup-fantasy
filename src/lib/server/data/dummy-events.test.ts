import { describe, expect, it } from 'vitest';
import { dummyEvents, type DummyMatch, type SquadMember } from './dummy-events';
import type { Position } from '../../game/types';

function squad(prefix: string): SquadMember[] {
	const make = (position: Position, n: number) =>
		Array.from({ length: n }, (_, i) => ({ id: `${prefix}-${position}-${i}`, position }));
	return [...make('GK', 2), ...make('DEF', 6), ...make('MID', 6), ...make('FWD', 4)];
}

const squads = new Map<string, SquadMember[]>([
	['AAA', squad('a')],
	['BBB', squad('b')]
]);
const positionOf = new Map([...squads.values()].flat().map((p) => [p.id, p.position]));

const matches: DummyMatch[] = [
	{ id: 'm1', homeTeamId: 'AAA', awayTeamId: 'BBB' },
	{ id: 'm2', homeTeamId: 'BBB', awayTeamId: 'AAA' }
];

describe('dummyEvents', () => {
	it('is deterministic', () => {
		expect(dummyEvents(matches, squads)).toEqual(dummyEvents(matches, squads));
	});

	it('marks every match as finished and only references known players', () => {
		const { stats, finishedMatchIds } = dummyEvents(matches, squads);
		expect(finishedMatchIds).toEqual(['m1', 'm2']);
		for (const row of stats) {
			expect(positionOf.has(row.playerId)).toBe(true);
			expect(['m1', 'm2']).toContain(row.matchId);
		}
	});

	it('writes at most one row per player per match', () => {
		const { stats } = dummyEvents(matches, squads);
		const keys = stats.map((r) => `${r.playerId}:${r.matchId}`);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('gives exactly one man of the match per match', () => {
		const { stats } = dummyEvents(matches, squads);
		for (const matchId of ['m1', 'm2']) {
			const motm = stats.filter((r) => r.matchId === matchId && r.motm);
			expect(motm).toHaveLength(1);
		}
	});

	it('only awards clean sheets to keepers and defenders', () => {
		const { stats } = dummyEvents(matches, squads);
		for (const row of stats) {
			if (row.cleanSheet) expect(['GK', 'DEF']).toContain(positionOf.get(row.playerId));
		}
	});

	it('skips matches whose squads are unknown', () => {
		const { stats, finishedMatchIds } = dummyEvents(
			[{ id: 'x', homeTeamId: 'ZZZ', awayTeamId: 'AAA' }],
			squads
		);
		expect(stats).toHaveLength(0);
		expect(finishedMatchIds).toHaveLength(0);
	});
});
