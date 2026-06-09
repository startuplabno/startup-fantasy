import { assert } from '$lib/assert';
import { POSITIONS, type Ownership, type Player, type Position, type SquadRules } from './types';

export interface SquadSummary {
	count: number;
	spent: number;
	remaining: number;
	byPosition: Record<Position, number>;
	byNation: Record<string, number>;
}

export interface SquadIssue {
	message: string;
}

export function summarize(players: Player[], budget: number): SquadSummary {
	const byPosition: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
	const byNation: Record<string, number> = {};
	let spent = 0;

	for (const p of players) {
		byPosition[p.position]++;
		byNation[p.nation] = (byNation[p.nation] ?? 0) + 1;
		spent += p.value;
	}

	return {
		count: players.length,
		spent,
		remaining: budget - spent,
		byPosition,
		byNation
	};
}

/**
 * Return every rule a squad currently breaks. An empty array means the squad
 * is legal and can be locked. Used by both the draft UI (live feedback) and
 * the server (authoritative check before persisting). Pass `ownership` to also
 * enforce the ownership cap.
 */
export function validate(
	players: Player[],
	rules: SquadRules,
	ownership?: Ownership
): SquadIssue[] {
	const issues: SquadIssue[] = [];
	const s = summarize(players, rules.budget);

	if (s.count !== rules.size) {
		issues.push({ message: `Pick exactly ${rules.size} players (you have ${s.count}).` });
	}

	if (s.spent > rules.budget) {
		issues.push({ message: `Over budget by ${s.spent - rules.budget}m.` });
	}

	for (const position of POSITIONS) {
		const { min, max } = rules.positions[position];
		const count = s.byPosition[position];
		if (count < min || count > max) {
			const range = min === max ? `${min}` : `${min}–${max}`;
			issues.push({ message: `${position}: need ${range}, have ${count}.` });
		}
	}

	for (const [nation, count] of Object.entries(s.byNation)) {
		if (count > rules.maxPerNation) {
			issues.push({ message: `Max ${rules.maxPerNation} from one nation (${nation}: ${count}).` });
		}
	}

	if (ownership) {
		for (const p of players) {
			if ((ownership.counts[p.id] ?? 0) >= ownership.cap) {
				issues.push({ message: `${p.name} is at the ownership cap.` });
			}
		}
	}

	return issues;
}

export function isValid(players: Player[], rules: SquadRules, ownership?: Ownership): boolean {
	return validate(players, rules, ownership).length === 0;
}

function shuffled<T>(items: T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

/** Every legal {GK, DEF, MID, FWD} count combination that sums to the squad size. */
function legalFormations(rules: SquadRules): Record<Position, number>[] {
	const formations: Record<Position, number>[] = [];
	const { GK, DEF, MID, FWD } = rules.positions;
	for (let d = DEF.min; d <= DEF.max; d++) {
		for (let m = MID.min; m <= MID.max; m++) {
			for (let f = FWD.min; f <= FWD.max; f++) {
				if (GK.min + d + m + f === rules.size) {
					formations.push({ GK: GK.min, DEF: d, MID: m, FWD: f });
				}
			}
		}
	}
	return formations;
}

/**
 * Best-effort random valid squad drawn from `pool`. Picks a legal formation,
 * then greedily fills each position while respecting the nation cap, budget,
 * and (when given) the ownership cap. Retries with fresh randomness; returns
 * the first valid squad it finds, or its best attempt if the pool can't satisfy
 * the rules.
 */
export function randomize(pool: Player[], rules: SquadRules, ownership?: Ownership): Player[] {
	assert(pool.length > 0, 'cannot randomize from an empty player pool');

	const formations = legalFormations(rules);
	assert(formations.length > 0, 'rules produce no legal formation');

	const atCap = (p: Player) =>
		ownership !== undefined && (ownership.counts[p.id] ?? 0) >= ownership.cap;

	let best: Player[] = [];

	for (let attempt = 0; attempt < 200; attempt++) {
		const formation = formations[Math.floor(Math.random() * formations.length)];
		const picks: Player[] = [];
		const nationCount: Record<string, number> = {};
		let spent = 0;

		for (const position of POSITIONS) {
			const need = formation[position];
			const candidates = shuffled(pool.filter((p) => p.position === position && !atCap(p)));
			let taken = 0;
			for (const p of candidates) {
				if (taken === need) break;
				if ((nationCount[p.nation] ?? 0) >= rules.maxPerNation) continue;
				if (spent + p.value > rules.budget) continue;
				picks.push(p);
				nationCount[p.nation] = (nationCount[p.nation] ?? 0) + 1;
				spent += p.value;
				taken++;
			}
		}

		if (isValid(picks, rules, ownership)) return picks;
		if (picks.length > best.length) best = picks;
	}

	return best;
}
