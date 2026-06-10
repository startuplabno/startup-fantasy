import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAllPlayers, getPlayersByIds } from '$lib/server/players';
import { getConfig, effectiveRules, isPastDeadline } from '$lib/server/config';
import { getOwnership } from '$lib/server/ownership';
import { validate } from '$lib/game/squad';
import { getTeam, lockTeam } from '$lib/server/teams';
import type { Ownership } from '$lib/game/types';

/** Ownership with an infinite cap encoded as null so it survives JSON transport. */
function serializeOwnership(o: Ownership): { counts: Record<string, number>; cap: number | null } {
	return { counts: o.counts, cap: Number.isFinite(o.cap) ? o.cap : null };
}

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const cfg = await getConfig();
	const [players, team, ownership] = await Promise.all([
		getAllPlayers(),
		getTeam(userId),
		getOwnership(userId)
	]);

	return {
		players,
		rules: effectiveRules(),
		ownership: serializeOwnership(ownership),
		deadlineAt: cfg.deadlineAt,
		pastDeadline: isPastDeadline(cfg),
		teamName: team?.name ?? '',
		selectedIds: team?.playerIds ?? []
	};
};

export const actions: Actions = {
	lock: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const cfg = await getConfig();

		if (isPastDeadline(cfg)) {
			return fail(403, { teamName: '', message: 'The deadline has passed — teams are locked.' });
		}

		const formData = await request.formData();
		const teamName = formData.get('teamName')?.toString().trim() ?? '';

		let selectedIds: string[];
		try {
			selectedIds = JSON.parse(formData.get('selection')?.toString() ?? '[]');
		} catch {
			return fail(400, { teamName, message: 'Could not read your selection.' });
		}

		if (!teamName) {
			return fail(400, { teamName, message: 'Give your team a name.' });
		}

		const players = await getPlayersByIds(selectedIds);
		const ownership = await getOwnership(userId);
		const issues = validate(players, effectiveRules(), ownership);
		if (issues.length > 0) {
			return fail(400, { teamName, message: issues.map((i) => i.message).join(' ') });
		}

		await lockTeam(userId, teamName, players);
		return redirect(302, '/team');
	}
};
